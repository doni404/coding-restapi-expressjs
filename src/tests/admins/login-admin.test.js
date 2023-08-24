import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "login-admin";

describe('/admin login endpoint', () => {
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
    });

    afterAll(async () => {
        // Clean up resources, close connections, etc.
        // For example, you can delete the created admin user
        if (createdAdmin) {
            // Delete admin user for testing
            const responseDelete = await request(app)
                .delete(`/v1/cms/admins/${createdAdmin.id}`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDelete.status).toBe(200);

            const responseDeletePermanent = await request(app)
                .delete(`/v1/cms/admins/${createdAdmin.id}/permanent`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDeletePermanent.status).toBe(200);
        }
    });

    it('should log in the admin user with valid credentials', async () => {
        const response = await request(app)
            .post('/v1/cms/admins/login')
            .send({
                email: testKey + process.env.TEST_ADMIN_EMAIL,
                password: process.env.TEST_ADMIN_PASSWORD
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');

        // Ensure the "data" object has the "token" property
        expect(response.body.data).toHaveProperty('token');

        // Store the token global
        jwtToken = response.body.data.token;
    });

    it('should return an error for incorrect email', async () => {
        const response = await request(app)
            .post('/v1/cms/admins/login')
            .send({
                email: 'incorrect@example.com',
                password: process.env.TEST_ADMIN_PASSWORD
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error for incorrect password', async () => {
        const response = await request(app)
            .post('/v1/cms/admins/login')
            .send({
                email: testKey + process.env.TEST_ADMIN_EMAIL,
                password: 'incorrectpassword'
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error for missing email or password', async () => {
        const response = await request(app)
            .post('/v1/cms/admins/login')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('code', 'error');
    });
});