import * as model from '../models/customer_product_price.js';
import db from '../configs/dbClient.js';
import dotenv from 'dotenv';
import { response, responseWithoutData } from '../utils/helper_response.js';
import { getPaginationParams } from '../utils/helper_query.js';

// Load environment variables from .env
dotenv.config({ path: './.env' });

export async function createCustomerProductPrice(req, res) {
    const { customer_store_id, product_id, price, price_sale, situation } = req.body;

    if (!customer_store_id || !product_id || !price || !price_sale || !situation) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Get the admin id who create this from token extraction and prepare data orders
        let adminWhoCreate = req.decoded.id;

        let data = {
            ...req.body,
            admin_created_id: adminWhoCreate,
            created_at: new Date(),
            admin_updated_id: adminWhoCreate,
            updated_at: new Date()
        }

        let createdData = await model.createCustomerProductPrice(db, data);

        return res.status(201).send(response('success', 'Customer product price successfully created!', createdData[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getCustomerProductPrices(req, res) {
    // Parse pagination params using the helper function
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get all customer product prices
        let customerProductPrices = await model.findAll(db, { limit, offset, sort });

        let totalCpp = (await model.findTotalCount(db))[0].total;

        let data = {
            items: customerProductPrices,
            pagination: {
                totalItems: totalCpp,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalCpp / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get all customer product prices', data));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getCustomerProductPricesByProductId(req, res) {
    const id = req.params.productId;
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get the customer product prices by product id
        let customerProductPrices = await model.findByProductId(db, id, { limit, offset, sort });

        let totalCpp = customerProductPrices.length;

        let data = {
            items: customerProductPrices,
            pagination: {
                totalItems: totalCpp,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalCpp / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get the customer product price by prodcut id', data));
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getCustomerProductPricesByCustomerStoreId(req, res) {
    const id = req.params.customerStoreId;
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get the customer product prices by product id
        let customerProductPrices = await model.findByCustomerStoreId(db, id, { limit, offset, sort });

        let totalCpp = customerProductPrices.length;

        let data = {
            items: customerProductPrices,
            pagination: {
                totalItems: totalCpp,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalCpp / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get the customer product price by customer store id', data));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getCustomerProductPricesActiveByCustomerStoreId(req, res) {
    const id = req.params.customerStoreId;

    try {
        // Get the customer product prices by product id
        let customerProductPrice = await model.findActiveByCustomerStoreId(db, id);

        if (customerProductPrice.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer product price not found!'));
        }

        return res.status(200).send(response('success', 'Successfully get the customer product price active by customer store id', customerProductPrice[0]));
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteCustomerProductPrice(req, res) {
    const id = req.params.customerProductPriceId;

    try {
        // Check the customer product price exist or not
        let customerProductPrice = await model.findById(db, id);

        if (customerProductPrice.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer product price not found!'));
        }

        // Get the admin id who delete this from token extraction
        let adminWhoDelete = req.decoded.id;

        let data = {
            id,
            situation: 'inactive',
            admin_deleted_id: adminWhoDelete,
            deleted_at: new Date(),
        }

        let deletedCpp = await model.deleteCustomerProductPrice(db, data);

        return res.status(200).send(response('sucess', 'Supplier successfully deleted !', deletedCpp[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteCustomerProductPricePermanent(req, res) {
    const id = req.params.customerProductPriceId;

    try {
        // Check the customer product price exist or not
        let customerProductPrice = await model.findDeletedById(db, id);

        if (customerProductPrice.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer product price not found!'));
        }

        customerProductPrice = customerProductPrice[0];

        await model.deleteCustomerProductPricePermanent(db, id);
        return res.status(200).send(responseWithoutData('success', 'Customer product price deleted permanently!'));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}