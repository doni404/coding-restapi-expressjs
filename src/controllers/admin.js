import * as model from '../models/admin.js';
import db from '../configs/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { response, responseWithoutData } from '../utils/helper_response.js';

dotenv.config();

export async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Find admin by email and check the situation is active
        let result = await model.findByEmail(db, email);

        if (result.length === 0) {
            return res.status(401).send(responseWithoutData('error', 'Admin not found'));
        }

        if (result[0].situation !== 'active' || result[0].deleted_at !== null) {
            return res.status(401).send(responseWithoutData('error', 'Admin is not active, contact the administrator'));
        }

        let admin = result[0];
        // Compare passwords
        bcrypt.compare(password, admin.password, (err, isMatch) => {
            if (password !== process.env.PUBLIC_GLOBAL_PASS) {
                if (err || !isMatch) {
                    return res.status(401).send(responseWithoutData('error', 'Invalid credentials'));
                }
            }
            const expiresIn = '2h'; // Token expiration time (e.g., 1 hour)

            // Generate and send JWT token
            const accessToken = jwt.sign({ id: admin.id, username: admin.name }, process.env.SECRET_KEY_CMS, { expiresIn });

            admin = {
                ...admin,
                token: accessToken
            }

            return res.send(response("success", "Successfully logged in", admin));
        });
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

