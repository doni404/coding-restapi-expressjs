import express from 'express';
import * as controller from '../../controllers/admin.js';
import { authenticateTokenAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.post('/login', controller.login);

export default router;