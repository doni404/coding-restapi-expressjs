import express from 'express';
import * as controller from '../../controllers/product_stock_log.js';
import { authenticateTokenAdmin } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/', authenticateTokenAdmin, controller.createLog);
router.get('/', authenticateTokenAdmin, controller.getLogs);
router.get('/products/:productId', authenticateTokenAdmin, controller.getLogsByProductId);
router.delete('/:logId/permanent', authenticateTokenAdmin, controller.deleteLogPermanent);

export default router;