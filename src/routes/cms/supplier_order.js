import express from 'express';
import * as controller from '../../controllers/supplier_order.js';
import { authenticateTokenAdmin } from '../../middlewares/appAuth.js';

const router = express.Router();

router.post('/', authenticateTokenAdmin, controller.createSupplierOrder);
router.get('/', authenticateTokenAdmin, controller.getSupplierOrders);
router.get('/:orderNumber', authenticateTokenAdmin, controller.getSupplierOrder);
router.put('/:supplierOrderId', authenticateTokenAdmin, controller.updateSupplierOrder);
router.patch('/:supplierOrderId/situation', authenticateTokenAdmin, controller.updateSupplierOrderSituation);
router.delete('/:supplierOrderId', authenticateTokenAdmin, controller.deleteSupplierOrder);
router.delete('/:supplierOrderId/permanent', authenticateTokenAdmin, controller.deleteSupplierOrderPermanent);

export default router;