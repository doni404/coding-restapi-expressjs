import request from 'supertest';
import app from '../../app';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: './.env.test' });
const testKey = "delete-customer-product-price";

describe('/customer-product-price delete', () => {
    let createdAdmin;
    let createdProduct;
    let createdCustomer;
    let createdCustomerStore;
    let createdCustomerProductPrice;
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
        // const imagePath = path.join(__dirname, '../assets/test-image.jpg'); // Assuming you have test-image.jpg in the ../assets directory
        // const imageBuffer = fs.readFileSync(imagePath);
        // const imageBase64 = imageBuffer.toString('base64');

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

        // Create customer product price
        const responseCustomerProductPrice = await request(app)
            .post('/v1/cms/customer-product-prices')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                customer_store_id: createdCustomerStore.id,
                product_id: createdProduct.id,
                price: 5000,
                price_sale: 15000,
                situation: "active",
                note: null
            });

        expect(responseCustomerProductPrice.status).toBe(201);
        expect(responseCustomerProductPrice.body).toHaveProperty('data');
        createdCustomerProductPrice = responseCustomerProductPrice.body.data;
    });

    afterAll(async () => {
        // Clean up resources, close connections, etc.
        // For example, you can delete the created admin user
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

    it('should soft delete customer product price with the valid data', async() => {
        const response = await request(app)
        .delete('/v1/cms/customer-product-prices/' + createdCustomerProductPrice.id)
        .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
    });

    it('should return an error when no data exist or already deleted', async() => {
        const response = await request(app)
        .delete('/v1/cms/customer-product-prices/0')
        .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');

        const responseDeleted = await request(app)
            .delete('/v1/cms/customer-product-prices/' + createdCustomerProductPrice.id)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(responseDeleted.status).toBe(404);
        expect(responseDeleted.body).toHaveProperty('code', 'error');
    });

    it('should return an error when no id in param', async () => {
        const response = await request(app)
            .delete('/v1/cms/customer-product-prices/')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
        expect(response.body).toHaveProperty('message', 'Invalid endpoint url');
    });

    it('should return an error when no authorization header', async () => {
        const response = await request(app)
            .delete('/v1/cms/customer-product-prices/' + createdCustomerProductPrice.id);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should return an error with wrong or invalid authorization token', async () => {
        const response = await request(app)
            .delete('/v1/cms/customer-product-prices/' + createdCustomerProductPrice.id)
            .set('Authorization', `Bearer ${jwtToken + "x"}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('code', 'error');
    });

    it('should delete customer permanently', async () => {
        const response = await request(app)
            .delete('/v1/cms/customer-product-prices/' + createdCustomerProductPrice.id + '/permanent')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(200);
    });

    it('should return an error when delete customer store permanently but not exist', async () => {
        const response = await request(app)
            .delete('/v1/cms/customer-product-prices/0/permanent')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'error');
    });
});