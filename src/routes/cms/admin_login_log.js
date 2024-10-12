import express from 'express';
import * as controller from '../../controllers/admin_login_log.js';
import { authenticateTokenAdmin } from '../../middlewares/appAuth.js';

const router = express.Router();

router.post('/', authenticateTokenAdmin, controller.createLogs);
router.get('/admins/:adminId', authenticateTokenAdmin, controller.getLogsByAdminId);

export default router;