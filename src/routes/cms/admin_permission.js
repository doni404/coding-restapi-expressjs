import express from 'express'
import * as controller from '../../controllers/admin_permission.js'
import { authenticateTokenAdmin } from '../../middlewares/appAuth.js'
import { checkBody } from '../../middlewares/bodyChecker.js'

const router = express.Router();

router.get('/', authenticateTokenAdmin, controller.getAllAdminPermissions)
router.get('/:id', authenticateTokenAdmin, controller.getAdminPermissionById)
router.post('/', authenticateTokenAdmin, checkBody, controller.createAdminPermission)

router.delete('/:id/permanent', authenticateTokenAdmin, controller.deleteAdminPermission)

export default router
