import cors from 'cors';
import express from 'express';
import { responseWithoutData } from './utils/helper_response.js';

import adminCMS from './routes/cms/admin.js';
import adminLoginLogCMS from './routes/cms/admin_login_log.js';
import productCMS from './routes/cms/product.js';
import productStockLogCMS from './routes/cms/product_stock_log.js';
import supplierCMS from './routes/cms/supplier.js';
import supplierOrderCMS from './routes/cms/supplier_order.js';
import customerCMS from './routes/cms/customer.js';
import customerLoginLogCMS from './routes/cms/customer_login_log.js';
import customerStoreCMS from './routes/cms/customer_store.js';
import customerProductPriceCMS from './routes/cms/customer_product_price.js';

// Defining the Express app
const app = express();

// Enabling CORS for all request
app.use(cors());

// Use express JSON format
app.use(express.json({
    limit: '20mb',
}));

// Declaring root endpoint
app.get('/', (req, res) => {
    res.send('CODING API v1');
});

// v1 cms
app.use('/v1/cms/admins', adminCMS);
app.use('/v1/cms/admin-login-logs', adminLoginLogCMS);
app.use('/v1/cms/products', productCMS);
app.use('/v1/cms/product-stock-logs', productStockLogCMS);
app.use('/v1/cms/suppliers', supplierCMS);
app.use('/v1/cms/supplier-orders', supplierOrderCMS);
app.use('/v1/cms/customers', customerCMS);
app.use('/v1/cms/customer-login-logs', customerLoginLogCMS);
app.use('/v1/cms/customer-stores', customerStoreCMS);
app.use('/v1/cms/customer-product-prices', customerProductPriceCMS);

// 404 Not Found Middleware
app.use((req, res, next) => {
    res.status(404).send(responseWithoutData('error', 'Invalid endpoint url'));
});

export default app;