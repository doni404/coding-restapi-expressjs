import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "create-admin";

describe('/admin create endpoint', () => {
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

    it('should create admin with the valid data', async () => {
        const response = await request(app)
            .post('/v1/cms/admins')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                name: process.env.TEST_ADMIN_NAME,
                email: testKey + "1" + process.env.TEST_ADMIN_EMAIL,
                password: process.env.TEST_ADMIN_PASSWORD,
                gender: "male",
                notification_email: "yes",
                notification_wa: "yes",
                situation: "active",
                note: null
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('data');
        let createdAdminData = response.body.data;

        // Delete
        await deleteAdmin(createdAdminData);
    });

    it('should return an error when creating an exist email', async () => {
        const response = await request(app)
            .post('/v1/cms/admins')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                name: process.env.TEST_ADMIN_NAME,
                email: testKey + process.env.TEST_ADMIN_EMAIL,
                password: process.env.TEST_ADMIN_PASSWORD,
                gender: "male",
                notification_email: "yes",
                notification_wa: "yes",
                situation: "active",
                note: null
            });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with missing required fields', async () => {
        const response = await request(app)
            .post('/v1/cms/admins')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with no authorization header', async () => {
        const response = await request(app)
            .post('/v1/cms/admins')
            .send({
                name: process.env.TEST_ADMIN_NAME,
                email: testKey + "1" + process.env.TEST_ADMIN_EMAIL,
                password: process.env.TEST_ADMIN_PASSWORD,
                gender: "male",
                notification_email: "yes",
                notification_wa: "yes",
                situation: "active",
                note: null
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or invalid authorization token', async () => {
        const response = await request(app)
            .post('/v1/cms/admins')
            .set('Authorization', `Bearer ${jwtToken+"x"}`)
            .send({
                name: process.env.TEST_ADMIN_NAME,
                email: testKey + "1" + process.env.TEST_ADMIN_EMAIL,
                password: process.env.TEST_ADMIN_PASSWORD,
                gender: "male",
                notification_email: "yes",
                notification_wa: "yes",
                situation: "active",
                note: null
            });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });
});