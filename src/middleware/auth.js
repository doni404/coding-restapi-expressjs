import jwt from 'jsonwebtoken'

import dotenv from 'dotenv'
import { responseWithoutData } from '../utils/helper_response.js'

dotenv.config()

export function authenticateTokenAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).send(responseWithoutData('error', 'Unauthorized'))
    }

    jwt.verify(token, process.env.SECRET_KEY_CMS, (err, user) => {
        if (err) {
            return res.status(403).send(responseWithoutData('error', 'Forbidden'))
        }
        req.user = user;
        next();
    });
}