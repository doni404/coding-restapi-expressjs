import cors from 'cors';
import express from 'express';
import { responseWithoutData } from './utils/helper_response.js';

import adminCms from './routes/cms/admin.js';
import adminLoginLogCms from './routes/cms/admin_login_log.js';
import adminPermissionCms from './routes/cms/admin_permission.js'
import adminRoleCms from './routes/cms/admin_role.js'

import productCms from './routes/cms/product.js';
import productStockLogCms from './routes/cms/product_stock_log.js';

import customerCMS from './routes/cms/customer.js';
import customerLoginLogCMS from './routes/cms/customer_login_log.js';
import customerStoreCMS from './routes/cms/customer_store.js';
import customerProductPriceCMS from './routes/cms/customer_product_price.js';
import supplierCMS from './routes/cms/supplier.js';
import supplierOrderCMS from './routes/cms/supplier_order.js';

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

// Declaring robots.txt for production and development environment
app.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /");
});

// v1 cms
app.use('/v1/cms/admins', adminCms);
app.use('/v1/cms/admin-login-logs', adminLoginLogCms);
app.use('/v1/cms/admin-permissions', adminPermissionCms);
app.use('/v1/cms/admin-roles', adminRoleCms);
app.use('/v1/cms/products', productCms);
app.use('/v1/cms/product-stock-logs', productStockLogCms);
// app.use('/v1/cms/suppliers', supplierCMS);
// app.use('/v1/cms/supplier-orders', supplierOrderCMS);
// app.use('/v1/cms/customers', customerCMS);
// app.use('/v1/cms/customer-login-logs', customerLoginLogCMS);
// app.use('/v1/cms/customer-stores', customerStoreCMS);
// app.use('/v1/cms/customer-product-prices', customerProductPriceCMS);

// 404 Not Found Middleware
app.use((req, res, next) => {
    res.status(404).send(responseWithoutData('error', 'Invalid endpoint url'));
});

export default app;