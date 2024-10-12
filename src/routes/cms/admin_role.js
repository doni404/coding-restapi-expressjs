import express from 'express'
import * as controller from '../../controllers/admin_role.js'
import { authenticateTokenAdmin } from '../../middlewares/appAuth.js'
import { checkBody } from '../../middlewares/bodyChecker.js'

const router = express.Router()

router.get('/', authenticateTokenAdmin, controller.getAllAdminRoles)
router.get('/:id', authenticateTokenAdmin, controller.getAdminRoleById)
router.post('/', authenticateTokenAdmin, checkBody, controller.createAdminRole)
router.put('/:id', authenticateTokenAdmin, checkBody, controller.updateAdminRole)
router.delete('/:id', authenticateTokenAdmin, controller.deleteAdminRole)
router.delete('/:id/permanent', authenticateTokenAdmin, controller.deleteAdminRolePermanently)

export default router