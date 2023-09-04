import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "get-log-admin";

describe('/admin-login-log get endpoint', () => {
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

    it('should get admin logs by admin id with the valid data', async () => {
        const response = await request(app)
            .get('/v1/cms/admin-login-logs/admins/' + createdAdmin.id)
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    it('should return empty array in data when no data exist', async () => {
        const response = await request(app)
            .get('/v1/cms/admin-login-logs/admins/0')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data', []);
    });

    it('should return an error when no params id in url', async () => {
        const response = await request(app)
            .get('/v1/cms/admin-login-logs/admins/')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when no authorization header', async () => {
        const response = await request(app)
            .get('/v1/cms/admin-login-logs/admins/0')

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or invalid authorization token', async () => {
        const response = await request(app)
            .get('/v1/cms/admin-login-logs/admins/0')
            .set('Authorization', `Bearer ${jwtToken + "x"}`)

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });
});