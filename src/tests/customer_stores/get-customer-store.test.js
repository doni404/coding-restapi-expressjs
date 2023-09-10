import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "get-customer-store";

describe('/customer-store get list and by id endpoint', () => {
    let createdAdmin;
    let createdCustomer;
    let createdCustomerStore;
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
        // Load an image, convert to base64
        const imagePath = path.join(__dirname, 'test-image.jpg'); // Assuming you have test-image.jpg in the same directory
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');

        const responseCustomer = await request(app)
            .post('/v1/cms/customers')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                code: "CUS01",
                name: testKey + " Customer Test",
                email: testKey + process.env.TEST_CUSTOMER_EMAIL,
                password: process.env.TEST_CUSTOMER_PASSWORD,
                phone: "081111111111",
                photo: imageBase64,
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

        // Create customer store test
        const responseCStore = await request(app)
            .post('/v1/cms/customer-stores')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                customer_id: createdCustomer.id,
                name: testKey + " Customer Store Test",
                tel: "08123123123",
                photo: imageBase64,
                zip: "60111",
                prefecture: "Jawa Barat",
                city: "Sidomulyo",
                address: "Jl. Adrenaline Test No 244",
                situation: "active",
                note: null
            });

        expect(responseCStore.status).toBe(201);
        expect(responseCStore.body).toHaveProperty('data');
        expect(responseCStore.body.data.photo).toBeDefined();
        createdCustomerStore = responseCStore.body.data;
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

    it('should get all customer stores with the valid data', async () => {
        const response = await request(app)
            .get('/v1/cms/customer-stores')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('items');
    });

    it('should return an error with no authorization header (all customer stores)', async() => {
        const response = await request(app)
            .get('/v1/cms/customer-stores')

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or ivalid auth token (all customer stores)', async () => {
        const response = await request(app)
            .get('/v1/cms/customer-stores')
            .set('Authorization', `Bearer ${jwtToken}+"x"`)

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should get customer store by id', async () => {
        // Get supplier data by Id
        const response = await request(app)
            .get('/v1/cms/customer-stores/' + createdCustomerStore.id)
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    it('should return an error when param not id', async () => {
        const response = await request(app)
            .get('/v1/cms/customer-stores/xxxx')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with no authorization header (customer store by id)', async () => {
        const response = await request(app)
            .get('/v1/cms/customer-stores/' + createdCustomerStore.id);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with invalid or wrong authorization token (customer by id)', async () => {
        const response = await request(app)
            .get('/v1/cms/customer-stores/' + createdCustomerStore.id)
            .set('Authorization', `Bearer ${jwtToken + "x"}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when data doesn\'t exist', async () => {
        const response = await request(app)
            .get('/v1/cms/customer-stores/xxx')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should get all customer store by customer id', async() => {
        const response = await request(app)
        .get('/v1/cms/customer-stores/customers/' + createdCustomer.id)
        .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    it('should return an error when get customer store by customer but customer not found ', async() => {
        const response = await request(app)
        .get('/v1/cms/customer-stores/customers/xxx')
        .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when get customer store by customer but with no authentication header', async() => {
        const response = await request(app)
        .get('/v1/cms/customer-stores/customers/' + createdCustomer.id);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when get customer store by customer but with use invalid authentication token', async() => {
        const response = await request(app)
        .get('/v1/cms/customer-stores/customers/' + createdCustomer.id)
        .set('Authorization', `Bearer ${jwtToken + "x"}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when data exist but deleted', async() => {
        // Soft delete customer store
        const responseDelete = await request(app)
            .delete('/v1/cms/customer-stores/' + createdCustomerStore.id)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDelete.status).toBe(200);

        // Get customer store by ID
        const response = await request(app)
            .get('/v1/cms/customer-stores/' + createdCustomerStore.id)
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');

        // Delete permanent the created customer store above
        const responseDeletePermanent = await request(app)
            .delete('/v1/cms/customer-stores/' + createdCustomerStore.id + '/permanent')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDeletePermanent.status).toBe(200);
    });
});