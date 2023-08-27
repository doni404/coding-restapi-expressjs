import * as model from '../models/product_stock_log.js';
import db from '../configs/db.js';
import dotenv from 'dotenv';
import { response, responseWithoutData } from '../utils/helper_response.js';
import { getPaginationParams } from '../utils/helper_query.js';

// Load environment variables from .env
dotenv.config({ path: './.env' });

export async function createLog(req, res) {
    const { product_id, quantity, type } = req.body;

    if (!product_id || !quantity || !type) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Get the admin id who create this from token extraction
        let adminWhoCreate = req.decoded.id;

        let data = {
            ...req.body,
            admin_created_id: adminWhoCreate,
            created_at: new Date()
        }

        let createdData = await model.createLog(db, data);

        return res.status(201).send(response('success', 'Product stock log successfully created!', createdData[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getLogs(req, res) {
    // Parse pagination params using the helper function
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get all stock logs
        let stockLogs = await model.findAll(db, { limit, offset, sort });

        let totalLogs = (await model.findTotalCount(db))[0].total;

        let data = {
            items: stockLogs,
            pagination: {
                totalItems: totalLogs,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalLogs / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get all stock logs', data));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getLogsByProductId(req, res) {
    const productId = req.params.productId;

    try {
        // Get the stock logs by product id
        let stockLogs = await model.findByProductId(db, productId);

        return res.status(200).send(response('success', 'Successfully get product stock logs', stockLogs));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteLogPermanent(req, res) {
    const id = req.params.logId;

    try {
        await model.deleteLogPermanent(db, id);

        return res.status(200).send(responseWithoutData('success', 'Stock logs deleted permanently!'));
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseWithoutData('error', 'something error')); 
    }
}