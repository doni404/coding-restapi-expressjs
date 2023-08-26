import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "delete-product";

describe('/admin delete endpoint', () => {
    let createdAdmin;
    let createdProduct;
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

        // Crate product test
        const responseProduct = await request(app)
            .post('/v1/cms/products')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                code: testKey + "TEST01",
                name: "Coding 01",
                description: "This is description of coding in test purpose",
                price: 22500,
                tax: 0,
                type: "food",
                stock: 0,
                stock_alert: 5,
                situation: "active",
                note: null
            });

        expect(responseProduct.status).toBe(201);
        expect(responseProduct.body).toHaveProperty('data');
        createdProduct = responseProduct.body.data;
    });

    afterAll(async () => {
        // not need delete after all because data already deleted within case.
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

    it('should soft delete product with the valid data', async() => {
        const response = await request(app)
        .delete('/v1/cms/products/' + createdProduct.id)
        .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
    });

    it('should return an error when no data exist or already deleted', async() => {
        const response = await request(app)
            .delete('/v1/cms/products/0')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');

        const responseDeleted = await request(app)
        .delete('/v1/cms/products/' + createdAdmin.id)
        .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDeleted.status).toBe(404);
        expect(responseDeleted.body).toHaveProperty('code', 'error');
    });

    it('should return an error when no id in param', async () => {
        const response = await request(app)
            .delete('/v1/cms/products/')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
        expect(response.body).toHaveProperty('message', 'Invalid endpoint url');
    });

    it('should return an error when no authorization header', async () => {
        const response = await request(app)
            .delete('/v1/cms/products/' + createdProduct.id);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or invalid authorization token', async () => {
        const response = await request(app)
            .delete('/v1/cms/products/' + createdProduct.id)
            .set('Authorization', `Bearer ${jwtToken + "x"}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should delete product permanently', async() => {
        const response = await request(app)
            .delete('/v1/cms/products/' + createdProduct.id + '/permanent')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
    });

    it('should return an error when delete product permanently but not exist', async() => {
        const response = await request(app)
            .delete('/v1/cms/products/0/permanent')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });
});