import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "get-admin";

describe('/admin get list and by id endpoint', () => {
    let createdAdmin;
    let jwtToken;

    beforeAll(async () => {
        // Create a temporary admin user for testing
        const response = await request(app)
            .post(`/v1/cms/admins/create-test`)
            .send({
                name: process.env.TEST_ADMIN_NAME,
                email: testKey + process.env.TEST_ADMIN_EMAIL,
                password: process.env.TEST_ADMIN_PASSWORD
            });

        expect(response.status).toBe(201); // Ensure the user was created
        createdAdmin = response.body.data; // Store the created admin user

        // Login admin to get the token
        const responseLogin = await request(app)
            .post('/v1/cms/admins/login')
            .send({
                email: testKey + process.env.TEST_ADMIN_EMAIL,
                password: process.env.TEST_ADMIN_PASSWORD
            });

        expect(responseLogin.status).toBe(200);
        expect(responseLogin.body).toHaveProperty('data');

        // Ensure the "data" object has the "token" property
        expect(responseLogin.body.data).toHaveProperty('token');

        // Store the token global
        jwtToken = responseLogin.body.data.token;
    });

    afterAll(async () => {
        // Clean up resources, close connections, etc.
        // For example, you can delete the created admin user
        await deleteAdmin(createdAdmin);
    });

    async function deleteAdmin(admin) {
        if (admin) {
            // Delete admin user for testing
            const responseDelete = await request(app)
                .delete(`/v1/cms/admins/${admin.id}`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDelete.status).toBe(200);

            const responseDeletePermanent = await request(app)
                .delete(`/v1/cms/admins/${admin.id}/permanent`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDeletePermanent.status).toBe(200);
        }
    }

    it('should get all admins with the valid data', async () => {
        const response = await request(app)
            .get('/v1/cms/admins')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('items');
    });

    it('should return an error with no authorization header (all admins)', async () => {
        const response = await request(app)
            .get('/v1/cms/admins')

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or ivalid auth token (all admin)', async () => {
        const response = await request(app)
            .get('/v1/cms/admins')
            .set('Authorization', `Bearer ${jwtToken}+"x"`)

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should get admin by id', async () => {
        const response = await request(app)
            .get('/v1/cms/admins/' + createdAdmin.id)
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    it('should return an error when param not id', async () => {
        const response = await request(app)
            .get('/v1/cms/admins/xxxx')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with no authorization header (admin by id)', async () => {
        const response = await request(app)
            .get('/v1/cms/admins/' + createdAdmin.id)

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when data doesn\'t exist', async () => {
        const response = await request(app)
            .get('/v1/cms/admins/0')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when data exist but deleted', async () => {
        // Create new data
        const responseCreate = await request(app)
            .post('/v1/cms/admins')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                name: process.env.TEST_ADMIN_NAME,
                email: testKey + "2" + process.env.TEST_ADMIN_EMAIL,
                password: process.env.TEST_ADMIN_PASSWORD
            });

        // Soft delete admin above
        const responseDelete = await request(app)
            .delete(`/v1/cms/admins/${responseCreate.body.data.id}`)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDelete.status).toBe(200);

        // Get admin by ID
        const response = await request(app)
            .get('/v1/cms/admins/' + responseCreate.body.data.id)
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');

        // Delete permanent the created admin above
        const responseDeletePermanent = await request(app)
            .delete(`/v1/cms/admins/${responseCreate.body.data.id}/permanent`)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDeletePermanent.status).toBe(200);
    });
});