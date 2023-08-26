import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "get-product";

describe('/product get list and by id endpoint', () => {
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

    async function deleteProduct(product) {
        if (product) {
            // Delete product for testing
            const responseDelete = await request(app)
                .delete(`/v1/cms/products/${product.id}`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDelete.status).toBe(200);

            const responseDeletePermanent = await request(app)
                .delete(`/v1/cms/products/${product.id}/permanent`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDeletePermanent.status).toBe(200);
        }
    }

    it('should get all products with the valid data', async () => {
        const response = await request(app)
            .get('/v1/cms/products')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('items');
    });

    it('should return an error with no authorization header (all products)', async () => {
        const response = await request(app)
            .get('/v1/cms/products')

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or ivalid auth token (all products)', async () => {
        const response = await request(app)
            .get('/v1/cms/products')
            .set('Authorization', `Bearer ${jwtToken}+"x"`)

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should get product by id', async () => {
        // Create test product
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
        
        // Get product data by Id
        const response = await request(app)
            .get('/v1/cms/products/' + responseProduct.body.data.id)
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');

        // Delete the created product
        deleteProduct(responseProduct.body.data);
    });

    it('should return an error when param not id', async () => {
        const response = await request(app)
            .get('/v1/cms/products/xxxx')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with no authorization header (product by id)', async () => {
        const response = await request(app)
            .get('/v1/cms/products/' + createdAdmin.id)

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when data doesn\'t exist', async () => {
        const response = await request(app)
            .get('/v1/cms/products/0')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when data exist but deleted', async () => {
        // Create test product
        const responseCreate = await request(app)
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

        // Soft delete product above
        const responseDelete = await request(app)
            .delete(`/v1/cms/products/${responseCreate.body.data.id}`)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDelete.status).toBe(200);

        // Get product by ID
        const response = await request(app)
            .get('/v1/cms/products/' + responseCreate.body.data.id)
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');

        // Delete permanent the created product above
        const responseDeletePermanent = await request(app)
            .delete(`/v1/cms/products/${responseCreate.body.data.id}/permanent`)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDeletePermanent.status).toBe(200);
    });
}); 