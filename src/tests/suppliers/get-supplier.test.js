import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "get-supplier";

describe('/supplier get list and by id endpoint', () => {
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

    async function deleteSupplier(supplier) {
        if (supplier) {
            // Delete supplier for testing
            const responseDelete = await request(app)
                .delete(`/v1/cms/suppliers/${supplier.id}`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDelete.status).toBe(200);

            const responseDeletePermanent = await request(app)
                .delete(`/v1/cms/suppliers/${supplier.id}/permanent`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDeletePermanent.status).toBe(200);
        }
    }

    it('should get all suppliers with the valid data', async () => {
        const response = await request(app)
            .get('/v1/cms/suppliers')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('items');
    });

    it('should return an error with no authorization header (all suppliers)', async () => {
        const response = await request(app)
            .get('/v1/cms/suppliers')

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or ivalid auth token (all suppliers)', async () => {
        const response = await request(app)
            .get('/v1/cms/suppliers')
            .set('Authorization', `Bearer ${jwtToken}+"x"`)

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should get supplier by id', async () => {
        // Create test supplier
        const responseSupplier = await request(app)
            .post('/v1/cms/suppliers')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                code: "SUP01",
                name: testKey + "Supplier Test",
                phone: "081111111111",
                photo: "",
                gender: "male",
                zip: "60111",
                prefecture: "Jawa Barat",
                city: "Sidomulyo",
                address: "Jl. Adrenaline Test No 244",
                situation: "active",
                bank_name: "Bank BTTP",
                account_name: "Johny Test",
                account_number: "1250099232338774",
                note: null
            });

        expect(responseSupplier.status).toBe(201);
        expect(responseSupplier.body).toHaveProperty('data');
        
        // Get supplier data by Id
        const response = await request(app)
            .get('/v1/cms/suppliers/' + responseSupplier.body.data.id)
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');

        // Delete the created supplier
        deleteSupplier(responseSupplier.body.data);
    });

    it('should return an error when param not id', async () => {
        const response = await request(app)
            .get('/v1/cms/suppliers/xxxx')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with no authorization header (supplier by id)', async () => {
        const response = await request(app)
            .get('/v1/cms/suppliers/0');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when data doesn\'t exist', async () => {
        const response = await request(app)
            .get('/v1/cms/suppliers/0')
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when data exist but deleted', async () => {
        // Create test supplier
        const responseCreate = await request(app)
            .post('/v1/cms/suppliers')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                code: "SUP03",
                name: testKey + "Supplier Test",
                phone: "081111111111",
                photo: "",
                gender: "male",
                zip: "60111",
                prefecture: "Jawa Barat",
                city: "Sidomulyo",
                address: "Jl. Adrenaline Test No 244",
                situation: "active",
                bank_name: "Bank BTTP",
                account_name: "Johny Test",
                account_number: "1250099232338774",
                note: null
            });

        // Soft delete supplier above
        const responseDelete = await request(app)
            .delete(`/v1/cms/suppliers/${responseCreate.body.data.id}`)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDelete.status).toBe(200);

        // Get supplier by ID
        const response = await request(app)
            .get('/v1/cms/suppliers/' + responseCreate.body.data.id)
            .set('Authorization', `Bearer ${jwtToken}`)

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');

        // Delete permanent the created supplier above
        const responseDeletePermanent = await request(app)
            .delete(`/v1/cms/suppliers/${responseCreate.body.data.id}/permanent`)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDeletePermanent.status).toBe(200);
    });
});