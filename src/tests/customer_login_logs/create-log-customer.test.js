import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "create-log-customer";

describe('/customer-login-log create endpoint', () => {
    let createdAdmin;
    let createdCustomer;
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

        // Crate customer test
        const responseCustomer = await request(app)
            .post('/v1/cms/customers')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                code: "CUS01",
                name: testKey + " Customer Test",
                email: testKey + process.env.TEST_CUSTOMER_EMAIL,
                password: process.env.TEST_CUSTOMER_PASSWORD,
                phone: "081111111111",
                photo: null,
                gender: "male",
                zip: "60111",
                prefecture: "Jawa Barat",
                city: "Sidomulyo",
                address: "Jl. Adrenaline Test No 244",
                situation: "active",
                note: null
            });

        expect(responseCustomer.status).toBe(201);
        expect(responseCustomer.body).toHaveProperty('data');
        createdCustomer = responseCustomer.body.data;
    });

    afterAll(async () => {
        // Clean up resources, close connections, etc.
        // For example, you can delete the created admin user
        await deleteCustomer(createdCustomer);
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

    async function deleteCustomer(customer) {
        if (customer) {
            // Delete customer for testing
            const responseDelete = await request(app)
                .delete(`/v1/cms/customers/${customer.id}`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDelete.status).toBe(200);

            const responseDeletePermanent = await request(app)
                .delete(`/v1/cms/customers/${customer.id}/permanent`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDeletePermanent.status).toBe(200);
        }
    }

    it('should create customer login logs with the valid data', async () => {
        const response = await request(app)
            .post('/v1/cms/customer-login-logs')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                customer_id: createdCustomer.id,
                ip_address: "182.0.169.100",
                platform: "pc",
                browser: "safari",
                os: "Mac OS",
                city: "Somewhere"
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('data');
    });

    it('should return an error when no authorization header', async () => {
        const response = await request(app)
            .post('/v1/cms/customer-login-logs')
            .send({
                customer_id: createdCustomer.id,
                ip_address: "182.0.169.100",
                platform: "pc",
                browser: "safari",
                os: "Mac OS",
                city: "Somewhere"
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or invalid authorization token', async () => {
        const response = await request(app)
            .post('/v1/cms/customer-login-logs')
            .set('Authorization', `Bearer ${jwtToken + "x"}`)
            .send({
                customer_id: createdCustomer.id,
                ip_address: "182.0.169.100",
                platform: "pc",
                browser: "safari",
                os: "Mac OS",
                city: "Somewhere"
            });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with missing required fields', async () => {
        const response = await request(app)
            .post('/v1/cms/customer-login-logs')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('code', 'error');
    });
});