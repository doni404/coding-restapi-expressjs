import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "delete-supplier-order";

describe('/supplier-order delete endpoint', () => {
    let createdAdmin;
    let createdSupplier;
    let createdProduct;
    let createdOrder;
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

        // Create the test supplier
        const responseSupplier = await request(app)
            .post('/v1/cms/suppliers')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                code: "SUP01",
                name: testKey + "Supplier Test",
                phone: "081111111111",
                photo: null,
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

        // Create a test product
        const responseProduct = await request(app)
            .post('/v1/cms/products')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                code: testKey + "TEST01",
                name: "Coding 01",
                description: "This is description of coding in test purpose",
                photo: null,
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

        // Create a test order with one item
        const responseOne = await request(app)
            .post('/v1/cms/supplier-orders')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                supplier_id: createdSupplier.id,
                order_number: testKey + "SO01",
                price: 10000,
                tax: 0,
                shipping_fee: 50000,
                shipping_track_number: "TRC0123123",
                shipping_company: "SHIP, Co, Ltd.",
                shipping_receipt: null,
                situation: "process",
                zip: "60243",
                prefecture: "Jawa Barat",
                city: "Sudokaryo",
                address: "Jl. Adrenaline Test No 244",
                payment_method: "transfer",
                bank_name: "Bank BTTP",
                account_name: "Johny Test",
                account_number: "1250099232338774",
                note: null,
                items: [
                    {
                        product_id: createdProduct.id,
                        price_unit: 5000,
                        tax_unit: 0,
                        quantity: 2,
                        price_total: 10000,
                        tax_total: 0,
                        situation: "new"
                    }
                ]
            });

        expect(responseOne.status).toBe(201);
        expect(responseOne.body).toHaveProperty('data');
        expect(responseOne.body.data.items).toBeDefined();
        createdOrder = responseOne.body.data;
    });

    afterAll(async () => {
        // Clean up resources, close connections, etc.
        // For example, you can delete the created admin user
        await deleteSupplier(createdSupplier);
        await deleteProduct(createdProduct);
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

    async function deleteSupplierOrder(supplierOrder) {
        if (supplierOrder) {
            // Delete supplier order for testing
            const responseDelete = await request(app)
                .delete(`/v1/cms/supplier-orders/${supplierOrder.id}`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDelete.status).toBe(200);

            const responseDeletePermanent = await request(app)
                .delete(`/v1/cms/supplier-orders/${supplierOrder.id}/permanent`)
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

    it('should soft delete supplier order with the valid data', async () => {
        // Soft delete the order
        const response = await request(app)
            .delete('/v1/cms/supplier-orders/' + createdOrder.id)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
    });

    it('should return an error when no data exist or already deleted', async() => {
        const response = await request(app)
            .delete('/v1/cms/supplier-orders/0')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');

        const responseDeleted = await request(app)
        .delete('/v1/cms/supplier-orders/' + createdOrder.id)
        .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDeleted.status).toBe(404);
        expect(responseDeleted.body).toHaveProperty('code', 'error');
    });

    it('should return an error when no id in param', async () => {
        const response = await request(app)
            .delete('/v1/cms/supplier-orders/')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
        expect(response.body).toHaveProperty('message', 'Invalid endpoint url');
    });

    it('should return an error when no authorization header', async () => {
        const response = await request(app)
            .delete('/v1/cms/supplier-orders/' + createdOrder.id);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or invalid authorization token', async () => {
        const response = await request(app)
            .delete('/v1/cms/supplier-orders/' + createdOrder.id)
            .set('Authorization', `Bearer ${jwtToken + "x"}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should delete supplier order permanently', async() => {
        const response = await request(app)
            .delete('/v1/cms/supplier-orders/' + createdOrder.id + '/permanent')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
    });

    it('should return an error when delete supplier order permanently but not exist', async() => {
        const response = await request(app)
            .delete('/v1/cms/supplier-orders/0/permanent')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });
});