import db from '../configs/dbClient.js';
import dotenv from 'dotenv';
import * as model from '../models/product.js';
import * as helperFile from '../utils/helper_file.js';
import * as helperModel from '../utils/helper_model.js';
import * as helperString from '../utils/helper_string.js';
import { imageOptionParams } from '../constants/index.js'
import { response, responseWithoutData } from '../utils/helper_response.js';

// Load environment variables from .env
dotenv.config({ path: './.env' });

const UPLOAD_PATH = `${process.env.UPLOAD_PATH}/products`;

export async function getAllProducts(req, res) {
    try {
        // Get all products
        let products = await model.getAllProducts(db, req.query);

        return res.status(200).send(response('success', 'Successfully get all products', products));
    } catch (error) {
        console.log("🚀 ~ getAllProducts ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getProductById(req, res) {
    let { params } = req;

    try {
        let id = params.id;

        // Get the product by Id
        let product = await model.getProductById(db, id);
        if (product.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Product not found!'));
        }

        return res.status(200).send(response('success', 'Successfully get product', product[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function createProduct(req, res) {
    let { body } = req;

    try {
        let productData = body;

        // Check the body, contains 'code', 'name', 'description', 'price'
        if (!helperString.containsRequiredKeys(productData, ['code', 'name', 'description', 'price'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: code, name, description and price are required'));
        }

        // Start the transaction
        db.getConnection(function (error, connection) {
            if (error) { // Failed to get connection from pool
                console.log("🚀 ~ connectionError:", error);
                return res.status(500).send(responseWithoutData('error', 'something error'));
            }

            // 1. Failed to start the transaction, release connection
            connection.beginTransaction(async function (error) { // open transaction
                if (error) {
                    console.log("🚀 ~ beginTransactionError:", error);
                    connection.release(); // Release connection if transaction cannot be started
                    return res.status(500).send(responseWithoutData('error', 'something error'));
                }

                try {
                    let data = {
                        ...productData,
                        created_at: new Date(),
                        updated_at: new Date()
                    }

                    data = helperModel.getUserRoleCreate(req.user, data);

                    // Check the product has photo or not and upload it
                    if (data.photo) {
                        data.photo = await helperFile.uploadImage(UPLOAD_PATH, data.photo, imageOptionParams);
                    }

                    // Create prodcut
                    let result = await model.createProduct(connection, data);
                    result = result[0];

                    // 2. If commit is successful, release connection
                    connection.commit(function (error) {
                        if (error) {
                            console.log("🚀 ~ commitError:", error);
                            return connection.rollback(function () {
                                connection.release(); // Release after rollback due to commit failure
                                return res.status(500).send(responseWithoutData('error', 'someting error'));
                            });
                        }

                        connection.release(); // Release connection after successful commit
                        return res.status(201).send(response('success', 'Product successfully created!', result));
                    });

                } catch (error) {
                    console.log("🚀 ~ rollbackError:", error);

                    // Rollback the transaction if error by deleting the uploaded image
                    if (data.photo) {
                        await helperFile.deleteFile(UPLOAD_PATH, data.photo);
                    }

                    connection.rollback(function () {
                        connection.release(); // Release after rollback due to transaction error
                        return res.status(500).send(responseWithoutData('error', 'something error'));
                    });
                }
            });
        });
    } catch (error) {
        console.log("🚀 ~ createProduct ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateProduct(req, res) {
    let { body, params } = req;

    try {
        let productData = body;
        let id = params.id;

        // Check the body, contains 'code', 'name', 'description', 'price'
        if (!helperString.containsRequiredKeys(productData, ['code', 'name', 'description', 'price'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: code, name, description and price are required'));
        }

        // Check the product exist or not
        let checkProduct = await model.getProductById(db, id);
        if (checkProduct.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Product not found!'));
        }

        // Start the transaction
        db.getConnection(function (error, connection) {
            if (error) { // Failed to get connection from pool
                console.log("🚀 ~ connectionError:", error);
                return res.status(500).send(responseWithoutData('error', 'something error'));
            }

            // 1. Failed to start the transaction, release connection
            connection.beginTransaction(async function (error) { // open transaction
                if (error) {
                    console.log("🚀 ~ beginTransactionError:", error);
                    connection.release(); // Release connection if transaction cannot be started
                    return res.status(500).send(responseWithoutData('error', 'something error'));
                }

                try {
                    let data = {
                        id,
                        ...productData,
                        updated_at: new Date()
                    }

                    data = helperModel.getUserRoleUpdate(req.user, data);

                    // Check the product has photo or not and upload it
                    if (data.photo) {
                        data.photo = await helperFile.uploadImage(UPLOAD_PATH, data.photo, imageOptionParams);
                    }

                    // Update prodcut
                    let result = await model.updateProduct(connection, data);
                    result = result[0];

                    console.log("🚀 ~ updateProduct ~ result", result);

                    // 2. If commit is successful, release connection
                    connection.commit(async function (error) {
                        if (error) {
                            console.log("🚀 ~ commitError:", error);
                            return connection.rollback(function () {
                                connection.release(); // Release after rollback due to commit failure
                                return res.status(500).send(responseWithoutData('error', 'someting error'));
                            });
                        }

                        // Delete the old photo if there's a new photo
                        if (data.photo && checkProduct[0].photo) {
                            await helperFile.deleteFile(UPLOAD_PATH, checkProduct[0].photo);
                        }

                        connection.release(); // Release connection after successful commit
                        return res.status(200).send(response('success', 'Product successfully updated!', result));
                    });

                } catch (error) {
                    console.log("🚀 ~ rollbackError:", error);

                    // Rollback the transaction if error by deleting the uploaded image
                    if (data.photo) {
                        await helperFile.deleteFile(UPLOAD_PATH, data.photo);
                    }

                    connection.rollback(function () {
                        connection.release(); // Release after rollback due to transaction error
                        return res.status(500).send(responseWithoutData('error', 'something error'));
                    });
                }
            });
        });
    } catch (error) {
        console.log("🚀 ~ updateProduct ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteProduct(req, res) {
    let { params } = req;

    try {
        let id = params.id;

        // Check the product exist or not
        let checkProduct = await model.getProductById(db, id);
        if (checkProduct.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Product not found!'));
        }

        let data = {
            id,
            situation: 'inactive',
            deleted_at: new Date(),
        }

        data = helperModel.getUserRoleDelete(req.user, data);

        let result = await model.deleteProduct(db, data);
        result = result[0];

        return res.status(200).send(response('sucess', 'Product successfully deleted !', result));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteProductPermanent(req, res) {
    let { params } = req;

    try {
        let id = params.id;

        // Check the product can be deleted permanently or not
        let deletedProduct = await model.getProductDeleted(db, id);
        if (deletedProduct.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Product can\'t be deleted permanently!'));
        }

        deletedProduct = deletedProduct[0];

        // Start the transaction
        db.getConnection(function (error, connection) {
            if (error) { // Failed to get connection from pool
                console.log("🚀 ~ connectionError:", error);
                return res.status(500).send(responseWithoutData('error', 'something error'));
            }

            // 1. Failed to start the transaction, release connection
            connection.beginTransaction(async function (error) { // open transaction
                if (error) {
                    console.log("🚀 ~ beginTransactionError:", error);
                    connection.release(); // Release connection if transaction cannot be started
                    return res.status(500).send(responseWithoutData('error', 'something error'));
                }

                try {
                    // Delete the product permanently
                    await model.deleteProductPermanent(connection, id);

                    connection.commit(async function (error) {
                        if (error) {
                            console.log("🚀 ~ commitError:", error);
                            return connection.rollback(function () {
                                connection.release(); // Release after rollback due to commit failure
                                return res.status(500).send(responseWithoutData('error', 'someting error'));
                            });
                        }

                        // Delete the photo if exist
                        if (deletedProduct.photo) {
                            await helperFile.deleteFile(UPLOAD_PATH, deletedProduct.photo);
                        }

                        connection.release(); // Release connection after successful commit
                        return res.status(200).send(responseWithoutData('success', 'Product deleted permanently!'));
                    });

                } catch (error) {
                    console.log("🚀 ~ rollbackError:", error);
                    connection.rollback(function () {
                        connection.release(); // Release after rollback due to transaction error
                        return res.status(500).send(responseWithoutData('error', 'something error'));
                    });
                }

            });
        });
    } catch (error) {
        console.log("🚀 ~ deleteProductPermanent ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}