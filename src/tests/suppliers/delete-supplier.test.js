import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "delete-supplier";

describe('/supplier delete endpoint', () => {
    let createdAdmin;
    let createdSupplier;
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

        // Crate supplier test
        // Load an image, convert to base64
        const imagePath = path.join(__dirname, 'test-image.jpg'); // Assuming you have test-image.jpg in the same directory
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');

        const responseSupplier = await request(app)
            .post('/v1/cms/suppliers')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                code: "SUP01",
                name: testKey + "Supplier Test",
                phone: "081111111111",
                photo: imageBase64,
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
        createdSupplier = responseSupplier.body.data;
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

    it('should soft delete supplier with the valid data', async() => {
        const response = await request(app)
        .delete('/v1/cms/suppliers/' + createdSupplier.id)
        .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
    });

    it('should return an error when no data exist or already deleted', async() => {
        const response = await request(app)
            .delete('/v1/cms/suppliers/0')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');

        const responseDeleted = await request(app)
        .delete('/v1/cms/suppliers/' + createdSupplier.id)
        .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDeleted.status).toBe(404);
        expect(responseDeleted.body).toHaveProperty('code', 'error');
    });

    it('should return an error when no id in param', async () => {
        const response = await request(app)
            .delete('/v1/cms/suppliers/')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
        expect(response.body).toHaveProperty('message', 'Invalid endpoint url');
    });

    it('should return an error when no authorization header', async () => {
        const response = await request(app)
            .delete('/v1/cms/suppliers/' + createdSupplier.id);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or invalid authorization token', async () => {
        const response = await request(app)
            .delete('/v1/cms/suppliers/' + createdSupplier.id)
            .set('Authorization', `Bearer ${jwtToken + "x"}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should delete supplier permanently', async() => {
        const response = await request(app)
            .delete('/v1/cms/suppliers/' + createdSupplier.id + '/permanent')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
    });

    it('should return an error when delete supplier permanently but not exist', async() => {
        const response = await request(app)
            .delete('/v1/cms/suppliers/0/permanent')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });
});