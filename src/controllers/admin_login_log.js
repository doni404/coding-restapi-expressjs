import * as model from '../models/admin_login_log.js';
import db from '../configs/db.js';
import { response, responseWithoutData } from '../utils/helper_response.js';

export async function getLogsByAdminId(req, res) {
    const adminId = req.params.adminId;

    try {
        // Get the admin login logs by admin id
        let adminLogs = await model.findByAdminId(db, adminId);

        return res.status(200).send(response('success', 'Successfully get admin login logs', adminLogs));
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function createLogs(req, res) {
    const { admin_id, ip_address, platform, browser, os, city } = req.body;

    if (!admin_id || !ip_address) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        let data = {
            ...req.body,
            created_at: new Date()
        }

        let createdData = await model.createAdminLoginLogs(db, data);

        return res.status(201).send(response('success', 'Admin login log successfully created!', createdData[0]));
    } catch(error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}