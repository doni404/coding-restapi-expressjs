import express from 'express';
import * as controller from '../../controllers/admin.js';
import { authenticateTokenAdmin } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/login', controller.login);
router.post('/create-test', controller.createAdmin);
router.post('/', authenticateTokenAdmin, controller.createAdmin);
router.get('/', authenticateTokenAdmin, controller.getAdmins);
router.get('/:adminId', authenticateTokenAdmin, controller.getAdmin);
router.put('/:adminId', authenticateTokenAdmin, controller.updateAdmin);
router.delete('/:adminId', authenticateTokenAdmin, controller.deleteAdmin);
router.delete('/:adminId/permanent', authenticateTokenAdmin, controller.deleteAdminPermanent);

router.post('/forgot-password', controller.forgotPassword);
router.patch('/reset-password/:resetToken', controller.resetPassword);

export default router;