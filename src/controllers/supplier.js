import * as model from '../models/supplier.js';
import db from '../configs/db.js';
import dotenv from 'dotenv';
import { response, responseWithoutData } from '../utils/helper_response.js';
import { getPaginationParams } from '../utils/helper_query.js';
import * as fileHelper from '../utils/helper_file.js';

// Load environment variables from .env
dotenv.config({ path: './.env' });

const UPLOAD_DIR = './uploads/suppliers/';

export async function createSupplier(req, res) {
    const { code, name, phone } = req.body;

    if (!code || !name || !phone) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Upload the photo if the image attached
        if (req.body.photo) {
            let imagePath = await fileHelper.saveBase64ImageToPath(req.body.photo, UPLOAD_DIR);
            req.body.photo = imagePath;
        }

        // Get the admin id who create this from token extraction
        let adminWhoCreate = req.decoded.id;

        let data = {
            ...req.body,
            admin_created_id: adminWhoCreate,
            created_at: new Date(),
            admin_updated_id: adminWhoCreate,
            updated_at: new Date()
        }

        let createdData = await model.createSupplier(db, data);

        return res.status(201).send(response('success', 'Supplier successfully created!', createdData[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getSuppliers(req, res) {
    // Parse pagination params using the helper function
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get all suppliers
        let suppliers = await model.findAll(db, { limit, offset, sort });

        let totalSuppliers = (await model.findTotalCount(db))[0].total;

        let data = {
            items: suppliers,
            pagination: {
                totalItems: totalSuppliers,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalSuppliers / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get all suppliers', data));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getSupplier(req, res) {
    const id = req.params.supplierId;

    try {
        // Get the supplier by Id
        let supplier = await model.findById(db, id);

        if (supplier.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Supplier not found!'));
        }

        return res.status(200).send(response('success', 'Successfully get the supplier', supplier[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateSupplier(req, res) {
    const id = req.params.supplierId;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Check the supplier exist or not
        let checkSupplier = await model.findById(db, id);

        if (checkSupplier.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Supplier not found!'));
        }

        checkSupplier = checkSupplier[0];

        // Check image need to update
        if (req.body.photo) {
            // If there's an existing photo, delete it
            if (checkSupplier.photo) {
                await fileHelper.deleteImage(checkSupplier.photo, UPLOAD_DIR);
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
            updated_at: new Date(),
        }

        let updatedSupplier = await model.updateSupplier(db, data);
        return res.status(200).send(response('sucess', 'Supplier successfully updated !', updatedSupplier[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteSupplier(req, res) {
    const id = req.params.supplierId;

    try {
        // Check the supplier exist or not
        let checkSupplier = await model.findById(db, id);

        if (checkSupplier.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Supplier not found!'));
        }

        // Get the admin id who delete this from token extraction
        let adminWhoDelete = req.decoded.id;

        let data = {
            id,
            situation: 'inactive',
            admin_deleted_id: adminWhoDelete,
            deleted_at: new Date(),
        }

        let deletedSupplier = await model.deleteSupplier(db, data);
        return res.status(200).send(response('sucess', 'Supplier successfully deleted !', deletedSupplier[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteSupplierPermanent(req, res) {
    const id = req.params.supplierId;

    try {
        let checkSupplier = await model.findDeletedById(db, id);

        if (checkSupplier.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Supplier can\'t be deleted permanently!'));
        }

        checkSupplier = checkSupplier[0];

        // If there's an existing photo, delete it
        if (checkSupplier.photo) {
            await fileHelper.deleteImage(checkSupplier.photo, UPLOAD_DIR);
        }

        await model.deleteSupplierPermanent(db, id);
        return res.status(200).send(responseWithoutData('success', 'Supplier deleted permanently!'));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}