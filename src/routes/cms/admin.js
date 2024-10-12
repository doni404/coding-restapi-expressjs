import express from 'express';
import * as controller from '../../controllers/admin.js';
import { authenticateTokenAdmin } from '../../middlewares/appAuth.js';
import { checkBody } from '../../middlewares/bodyChecker.js'

const router = express.Router();

router.get('/', authenticateTokenAdmin, controller.getAllAdmins);
router.get('/:id', authenticateTokenAdmin, controller.getAdminById);
router.post('/', authenticateTokenAdmin, checkBody, controller.createAdmin);

router.post('/login', checkBody, controller.login);
router.post('/forgot-password', checkBody, controller.forgotPassword);
router.patch('/reset-password/:resetPassToken', checkBody, controller.resetPassword);
router.post('/verify-token-auth', checkBody, controller.verifyAdminTokenAuth);
router.patch('/:id/update-password', authenticateTokenAdmin, checkBody, controller.updatePassword);

router.post('/create-test', controller.createAdmin);
router.put('/:id', authenticateTokenAdmin, controller.updateAdmin);
router.delete('/:id', authenticateTokenAdmin, controller.deleteAdmin);
router.delete('/:id/permanent', authenticateTokenAdmin, controller.deleteAdminPermanent);

export default router;