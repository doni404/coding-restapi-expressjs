import express from 'express';
import * as controller from '../../controllers/customer_product_price.js';
import { authenticateTokenAdmin } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/', authenticateTokenAdmin, controller.createCustomerProductPrice);
router.get('/', authenticateTokenAdmin, controller.getCustomerProductPrices);
router.get('/products/:productId', authenticateTokenAdmin, controller.getCustomerProductPricesByProductId);
router.get('/customer-stores/:customerStoreId', authenticateTokenAdmin, controller.getCustomerProductPricesByCustomerStoreId);
router.get('/customer-stores/:customerStoreId/active', authenticateTokenAdmin, controller.getCustomerProductPricesActiveByCustomerStoreId);
router.delete('/:customerProductPriceId', authenticateTokenAdmin, controller.deleteCustomerProductPrice);
router.delete('/:customerProductPriceId/permanent', authenticateTokenAdmin, controller.deleteCustomerProductPricePermanent);

export default router;