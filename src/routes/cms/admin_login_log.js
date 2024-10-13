import express from 'express';
import * as controller from '../../controllers/admin_login_log.js';
import { authenticateTokenAdmin } from '../../middlewares/appAuth.js';

const router = express.Router();

router.post('/', authenticateTokenAdmin, controller.createAdminLoginLog);
router.get('/admins/:id', authenticateTokenAdmin, controller.getAdminLoginLogsByAdminId);

export default router;