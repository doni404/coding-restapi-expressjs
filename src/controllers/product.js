import * as model from '../models/product.js';
import db from '../configs/dbClient.js';
import dotenv from 'dotenv';
import { response, responseWithoutData } from '../utils/helper_response.js';
import { getPaginationParams } from '../utils/helper_query.js';
import * as fileHelper from '../utils/helper_file.js';

// Load environment variables from .env
dotenv.config({ path: './.env' });

const UPLOAD_DIR = './uploads/products/';

export async function createProduct(req, res) {
    const { code, name, price, type } = req.body;

    if (!code || !name || !price || !type) {
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

        let createdData = await model.createProduct(db, data);

        return res.status(201).send(response('success', 'Product successfully created!', createdData[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getProducts(req, res) {
    // Parse pagination params using the helper function
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get all products
        let products = await model.findAll(db, { limit, offset, sort });

        let totalProducts = (await model.findTotalCount(db))[0].total;

        let data = {
            items: products,
            pagination: {
                totalItems: totalProducts,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalProducts / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get all products', data));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getProduct(req, res) {
    const id = req.params.productId;

    try {
        // Get the product by Id
        let product = await model.findById(db, id);

        if (product.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Product not found!'));
        }

        return res.status(200).send(response('success', 'Successfully get product', product[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateProduct(req, res) {
    const id = req.params.productId;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Check the product exist or not
        let checkProduct = await model.findById(db, id);

        if (checkProduct.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Product not found!'));
        }

        checkProduct = checkProduct[0];

        // Check image need to update
        if (req.body.photo) {
            // If there's an existing photo, delete it
            if (checkProduct.photo) {
                await fileHelper.deleteImage(checkProduct.photo, UPLOAD_DIR);
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

        let updatedProduct = await model.updateProduct(db, data);
        return res.status(200).send(response('sucess', 'Product successfully updated !', updatedProduct[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteProduct(req, res) {
    const id = req.params.productId;

    try {
        // Check the product exist or not
        let checkProduct = await model.findById(db, id);

        if (checkProduct.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Product not found!'));
        }

        // Get the admin id who delete this from token extraction
        let adminWhoDelete = req.decoded.id;

        let data = {
            id,
            situation: 'inactive',
            admin_deleted_id: adminWhoDelete,
            deleted_at: new Date(),
        }

        let deletedProduct = await model.deleteProduct(db, data);
        return res.status(200).send(response('sucess', 'Product successfully deleted !', deletedProduct[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteProductPermanent(req, res) {
    const id = req.params.productId;

    try {
        let checkProduct = await model.findDeletedById(db, id);

        if (checkProduct.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Product can\'t be deleted permanently!'));
        }

        checkProduct = checkProduct[0];

        // If there's an existing photo, delete it
        if (checkProduct.photo) {
            await fileHelper.deleteImage(checkProduct.photo, UPLOAD_DIR);
        }

        await model.deleteProductPermanent(db, id);
        return res.status(200).send(responseWithoutData('success', 'Product deleted permanently!'));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}