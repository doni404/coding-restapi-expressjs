import express from 'express';
import * as controller from '../../controllers/product.js';
import { authenticateTokenAdmin } from '../../middlewares/appAuth.js';
import { checkBody } from '../../middlewares/bodyChecker.js';

const router = express.Router();

router.get('/', authenticateTokenAdmin, controller.getAllProducts);
router.get('/:id', authenticateTokenAdmin, controller.getProductById);
router.post('/', authenticateTokenAdmin, checkBody, controller.createProduct);
router.put('/:id', authenticateTokenAdmin, checkBody, controller.updateProduct);
router.delete('/:id', authenticateTokenAdmin, controller.deleteProduct);
router.delete('/:id/permanent', authenticateTokenAdmin, controller.deleteProductPermanent);

export default router;