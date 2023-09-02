import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "get-supplier-order";

describe('/supplier-order get list and by order number endpoint', () => {
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
        await deleteSupplierOrder(createdOrder);
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
            // Delete supplier for testing
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

    it('should get all supplier orders with the valid data', async () => {
        const response = await request(app)
            .get('/v1/cms/supplier-orders')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('items');
    });

    it('should return an error with no authorization header (all orders)', async () => {
        const response = await request(app)
            .get('/v1/cms/supplier-orders');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or ivalid auth token (all products)', async () => {
        const response = await request(app)
            .get('/v1/cms/supplier-orders')
            .set('Authorization', `Bearer ${jwtToken}+"x"`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should get orders by order number', async () => {
        // Get the order data by order number
        const response = await request(app)
            .get('/v1/cms/supplier-orders/' + createdOrder.order_number)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('items');
    });

    it('should return an error when data doesn\'t exist', async () => {
        const response = await request(app)
            .get('/v1/cms/supplier-orders/xxxx')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with no authorization header (order by order number)', async () => {
        const response = await request(app)
            .get('/v1/cms/supplier-orders/' + createdOrder.order_number);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or invalid token (order by order number)', async () => {
        const response = await request(app)
            .get('/v1/cms/supplier-orders/' + createdOrder.order_number)
            .set('Authorization', `Bearer ${jwtToken + "x"}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error when data exist but deleted', async () => {
        // Create a test order with one item
        const responseOrder = await request(app)
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

        expect(responseOrder.status).toBe(201);
        expect(responseOrder.body).toHaveProperty('data');
        expect(responseOrder.body.data.items).toBeDefined();

        // Soft delete the test order
        const responseDelete = await request(app)
            .delete('/v1/cms/supplier-orders/' + responseOrder.body.data.id)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDelete.status).toBe(200);

        // Get the order data by order number
        const response = await request(app)
            .get('/v1/cms/supplier-orders/' + responseOrder.body.data.order_number)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');

        // Permanent delete the test order
        const responseDeletePermanent = await request(app)
            .delete('/v1/cms/supplier-orders/' + responseOrder.body.data.id + '/permanent')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDeletePermanent.status).toBe(200);
    });
});