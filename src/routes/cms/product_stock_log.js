import express from 'express';
import * as controller from '../../controllers/product_stock_log.js';
import { authenticateTokenAdmin } from '../../middlewares/appAuth.js';
import { checkBody } from '../../middlewares/bodyChecker.js'

const router = express.Router();

router.post('/', authenticateTokenAdmin, checkBody, controller.createProductStockLog);
router.get('/', authenticateTokenAdmin, controller.getAllProductStockLogs);
router.get('/products/:id', authenticateTokenAdmin, controller.getProductLogsByProductId);
router.delete('/:id/permanent', authenticateTokenAdmin, controller.deleteProductStockLogPermanent);

export default router;