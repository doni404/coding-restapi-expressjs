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

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_CMS);
        req.decoded = decodedToken;
        next();
    } catch (error) {
        return res.status(403).send(responseWithoutData('error', 'Forbidden'))
    }

}

export function authenticateTokenCustomer(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).send(responseWithoutData('error', 'Unauthorized'))
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_CUSTOMER);
        req.decoded = decodedToken;
        next();
    } catch (error) {
        return res.status(403).send(responseWithoutData('error', 'Forbidden'))
    }

}