import express from 'express';
import * as controller from '../../controllers/customer.js';
import { authenticateTokenAdmin, authenticateTokenCustomer } from '../../middlewares/appAuth.js';

const router = express.Router();

router.post('/login', controller.login);
router.post('/', authenticateTokenAdmin, controller.createCustomer);
router.get('/', authenticateTokenAdmin, controller.getCustomers);
router.get('/:customerId', authenticateTokenAdmin, controller.getCustomer);
router.put('/:customerId', authenticateTokenAdmin, controller.updateCustomer);
router.delete('/:customerId', authenticateTokenAdmin, controller.deleteCustomer);
router.delete('/:customerId/permanent', authenticateTokenAdmin, controller.deleteCustomerPermanent);

router.post('/forgot-password', controller.forgotPassword);
router.patch('/reset-password/:resetToken', controller.resetPassword);

export default router;