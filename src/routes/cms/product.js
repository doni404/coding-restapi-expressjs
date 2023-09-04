import express from 'express';
import * as controller from '../../controllers/product.js';
import { authenticateTokenAdmin } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/', authenticateTokenAdmin, controller.createProduct);
router.get('/', authenticateTokenAdmin, controller.getProducts);
router.get('/:productId', authenticateTokenAdmin, controller.getProduct);
router.put('/:productId', authenticateTokenAdmin, controller.updateProduct);
router.delete('/:productId', authenticateTokenAdmin, controller.deleteProduct);
router.delete('/:productId/permanent', authenticateTokenAdmin, controller.deleteProductPermanent);

export default router;