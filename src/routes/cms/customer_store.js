import express from 'express';
import * as controller from '../../controllers/customer_store.js';
import { authenticateTokenAdmin } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/', authenticateTokenAdmin, controller.createCustomerStore);
router.get('/', authenticateTokenAdmin, controller.getCustomerStores);
router.get('/:customerStoreId', authenticateTokenAdmin, controller.getCustomerStore);
router.get('/customers/:customerId', authenticateTokenAdmin, controller.getCustomerStoreByCustomer);
router.put('/:customerStoreId', authenticateTokenAdmin, controller.updateCustomerStore);
router.delete('/:customerStoreId', authenticateTokenAdmin, controller.deleteCustomerStore);
router.delete('/:customerStoreId/permanent', authenticateTokenAdmin, controller.deleteCustomerStorePermanent);

export default router;