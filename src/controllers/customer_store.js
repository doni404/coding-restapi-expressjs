import * as model from '../models/customer_store.js';
import * as modelCustomer from '../models/customer.js';
import db from '../configs/dbClient.js';
import dotenv from 'dotenv';
import { response, responseWithoutData } from '../utils/helper_response.js';
import { getPaginationParams } from '../utils/helper_query.js';
import * as mailerHelper from '../utils/helper_mailer.js';
import * as fileHelper from '../utils/helper_file.js';

// Load environment variables from .env
dotenv.config({ path: './.env' });

const UPLOAD_DIR = './uploads/customer-stores/';

export async function createCustomerStore(req, res) {
    const { customer_id, name, tel } = req.body;

    if (!customer_id || !name || !tel) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Upload the photo if the image attached
        if (req.body.photo) {
            let imagePath = await fileHelper.saveBase64ImageToPath(req.body.photo, UPLOAD_DIR);
            req.body.photo = imagePath;
        }

        // Get admin id who create this from token extraction
        let adminWhoCreate = req.decoded.id;

        let data = {
            ...req.body,
            admin_created_id: adminWhoCreate,
            created_at: new Date(),
            admin_updated_id: adminWhoCreate,
            updated_at: new Date()
        }

        let createdCustomerStore = await model.createCustomerStore(db, data);

        return res.status(201).send(response('success', 'Customer store successfully created!', createdCustomerStore[0])); 
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getCustomerStores(req, res) {
    // Parse pagination params using the helper function
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get all customers
        let customerStores = await model.findAll(db, { limit, offset, sort });

        let totalCustomerStores = (await model.findTotalCount(db))[0].total;

        let data = {
            items: customerStores,
            pagination: {
                totalItems: totalCustomerStores,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalCustomerStores / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get all customer stores', data));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getCustomerStore(req, res) {
    const id = req.params.customerStoreId;

    try {
        // Get the customer store by id
        let customerStore = await model.findById(db, id);

        if (customerStore.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer store not found!'));
        }

        return res.status(200).send(response('success', 'Successfully get customer store', customerStore[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getCustomerStoreByCustomer(req, res) {
    const id = req.params.customerId;

    try {
        // Get the customer store by id
        let customerStores = await model.findByCustomerId(db, id);

        if (customerStores.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer store by customer id were not found!'));
        }

        return res.status(200).send(response('success', 'Successfully get customer stores by customer', customerStores));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateCustomerStore(req, res) {
    const id = req.params.customerStoreId;
    const { customer_id, name, tel } = req.body;

    if (!customer_id || !name || !tel) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Check the customer store exist or not
        let checkCustomerStore = await model.findById(db, id);

        if (checkCustomerStore.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer store not found!'));
        }

        // Check if the customer id want to change but data not found
        if (req.body.customer_id) {
            let checkCustomer = await modelCustomer.findById(db, req.body.customer_id);
            
            if (checkCustomer.length === 0) {
                return res.status(404).send(responseWithoutData('error', 'Customer not found!'));
            }
        }

        // Check image need to update
        if (req.body.photo) {
            // If there's an existing photo, delete it
            if (checkCustomerStore[0].photo) {
                await fileHelper.deleteImage(checkCustomerStore[0].photo, UPLOAD_DIR);
            }

            // Upload the new photo
            let newImagePath = await fileHelper.saveBase64ImageToPath(req.body.photo, UPLOAD_DIR);
            req.body.photo = newImagePath;
        }

        // Get the admin id who update this from token extraction
        let adminWhoUpdate = req.decoded.id;

        let data = {
            id,
            ...req.body,
            admin_updated_id: adminWhoUpdate,
            updated_at: new Date()
        }

        let updatedCustomerStore = await model.updateCustomerStore(db, data);

        return res.status(200).send(response('sucess', 'Customer store successfully updated !', updatedCustomerStore[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteCustomerStore(req, res) {
    const id = req.params.customerStoreId;

    try {
        // Check the customer store exist or not
        let checkCustomerStore = await model.findById(db, id);

        if (checkCustomerStore.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer store was not found!'));
        }

        // Get the admin id who delete this from token extraction
        let adminWhoDelete = req.decoded.id;

        let data = {
            id,
            situation: 'inactive',
            admin_deleted_id: adminWhoDelete,
            deleted_at: new Date(),
        }

        let deletedCustomerStore = await model.deleteCustomerStore(db, data);

        return res.status(200).send(response('sucess', 'Customer successfully deleted !', deletedCustomerStore[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteCustomerStorePermanent(req, res) {
    const id = req.params.customerStoreId;

    try {
        let checkCustomerStore = await model.findDeletedById(db, id);

        if (checkCustomerStore.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer store not found!'));
        }

        // If there's an existing photo, delete it
        if (checkCustomerStore[0].photo) {
            await fileHelper.deleteImage(checkCustomerStore[0].photo, UPLOAD_DIR);
        }

        await model.deleteCustomerStorePermanent(db, id);

        return res.status(200).send(responseWithoutData('sucess', 'Customer store permanently deleted !'));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}