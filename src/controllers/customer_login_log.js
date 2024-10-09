import * as model from '../models/customer_login_log.js';
import db from '../configs/dbClient.js';
import { response, responseWithoutData } from '../utils/helper_response.js';

export async function getLogsByCustomerId(req, res) {
    const customerId = req.params.customerId;

    try {
        // Get the customer login logs by customer id
        let customerLogs = await model.findByCustomerId(db, customerId);

        return res.status(200).send(response('success', 'Successfully get customer login logs', customerLogs));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function createLogs(req, res) {
    const { customer_id, ip_address, platform, browser, os, city } = req.body;

    if (!customer_id || !ip_address) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        let data = {
            ...req.body,
            created_at: new Date()
        }

        let createdData = await model.createCustomerLoginLogs(db, data);

        return res.status(201).send(response('success', 'Customer login log successfully created!', createdData[0]));
    } catch(error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}