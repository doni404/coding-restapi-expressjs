import express from 'express';
import * as controller from '../../controllers/customer_login_log.js';
import { authenticateTokenAdmin } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/', authenticateTokenAdmin, controller.createLogs);
router.get('/customers/:customerId', authenticateTokenAdmin, controller.getLogsByCustomerId);

export default router;