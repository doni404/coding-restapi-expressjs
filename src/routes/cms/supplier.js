import express from 'express';
import * as controller from '../../controllers/supplier.js';
import { authenticateTokenAdmin } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/', authenticateTokenAdmin, controller.createSupplier);
router.get('/', authenticateTokenAdmin, controller.getSuppliers);
router.get('/:supplierId', authenticateTokenAdmin, controller.getSupplier);
router.put('/:supplierId', authenticateTokenAdmin, controller.updateSupplier);
router.delete('/:supplierId', authenticateTokenAdmin, controller.deleteSupplier);
router.delete('/:supplierId/permanent', authenticateTokenAdmin, controller.deleteSupplierPermanent);

export default router;