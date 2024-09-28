import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "create-customer-order";

describe('/customer-order get list and by order number endpoint', () => {
    let createdAdmin;
    let createdProduct;
    let createdCustomer;
    let createdCustomerStore;
    let createdCustomerOrder;
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

        // Create customer store test
        const responseCStore = await request(app)
            .post('/v1/cms/customer-stores')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                customer_id: createdCustomer.id,
                name: testKey + " Customer Store Test",
                tel: "08123123123",
                photo: null,
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

        // Create product test
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

        // Create customer order
        const responseCustomerOrder = await request(app)
            .post('/v1/cms/customer-orders')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                customer_store_id: createdCustomerStore.id,
                price: 500000,
                tax: 5000,
                situation: "process",
                store_name: createdCustomerStore.name,
                store_zip: createdCustomerStore.zip,
                store_prefecture: createdCustomerStore.prefecture,
                store_address: createdCustomerStore.address,
                payment_method: "transfer",
                bank_name: "Bank Mandiri",
                account_name: "William Daendals",
                account_number: "1420022248958",
                note: "note",
                items: [
                    {
                        product_id: createdProduct.id,
                        price: 5000,
                        tax: 500,
                        quantity: 10,
                        type: "order"
                    }
                ]
            });

        expect(responseCustomerOrder.status).toBe(201);
        expect(responseCustomerOrder.body).toHaveProperty('data');
        expect(responseCustomerOrder.body.data).toHaveProperty('items');
        createdCustomerOrder = responseCustomerOrder.body.data;
    });

    afterAll(async () => {
        // Clean up resources, close connections, etc.
        // For example, you can delete the created admin user
        await deleteCustomerOrder(createdCustomerOrder);
        await deleteCustomerStore(createdCustomerStore);
        await deleteCustomer(createdCustomer);
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

    async function deleteCustomerStore(customerStore) {
        if (customerStore) {
            // Delete customer store for testing
            const responseDelete = await request(app)
                .delete(`/v1/cms/customer-stores/${customerStore.id}`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDelete.status).toBe(200);

            const responseDeletePermanent = await request(app)
                .delete(`/v1/cms/customer-stores/${customerStore.id}/permanent`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDeletePermanent.status).toBe(200);
        }
    }

    async function deleteCustomerOrder(customerOrder) {
        if (customerOrder) {
            // Delete customer order for testing
            const responseDelete = await request(app)
                .delete(`/v1/cms/customer-orders/${customerOrder.id}`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDelete.status).toBe(200);

            const responseDeletePermanent = await request(app)
                .delete(`/v1/cms/customer-orders/${customerOrder.id}/permanent`)
                .set('Authorization', `Bearer ${jwtToken}`);

            expect(responseDeletePermanent.status).toBe(200);
        }
    }

    it('should get all customer orders with the valid data', async () => {
        const response = await request(app)
            .get('/v1/cms/customer-orders')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('items');
    });

    it('should return an error with no authorization header (all customer orders)', async () => {
        const response = await request(app)
            .get('/v1/cms/customer-orders');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or invalid auth token (all customer orders)', async() => {
        const response = await request(app)
            .get('/v1/cms/customer-orders')
            .set('Authorization', `Bearer ${jwtToken + "x"}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should get customer order by order number', async() => {
        const response = await request(app)
            .get('/v1/cms/customer-orders/' + createdCustomerOrder.order_number)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    it('should return an error when no data with the order number', async() => {
        const response = await request(app)
            .get('/v1/cms/customer-orders/' + createdCustomerOrder.order_number + "xxx")
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with no authorization header (customer order by order number)', async() => {
        const response = await request(app)
            .get('/v1/cms/customer-orders/' + createdCustomerOrder.order_number);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or invalid auth token (customer order by order number)', async() => {
        const response = await request(app)
            .get('/v1/cms/customer-orders/' + createdCustomerOrder.order_number)
            .set('Authorization', `Bearer ${jwtToken + "x"}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });
});