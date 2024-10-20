import db from '../configs/dbClient.js';
import dotenv from 'dotenv';
import * as model from '../models/product_stock_log.js';
import * as modelProduct from '../models/product.js';
import * as helperModel from '../utils/helper_model.js';
import * as helperString from '../utils/helper_string.js';
import { response, responseWithoutData } from '../utils/helper_response.js';

// Load environment variables from .env
dotenv.config({ path: './.env' });

export async function createProductStockLog(req, res) {
    let { body } = req;

    try {
        let productStockLog = body;

        // Check the body, contains 'product_id', 'stock_change', 'change_reason'
        if (!helperString.containsRequiredKeys(productStockLog, ['product_id', 'stock_change', 'change_reason'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: product_id, stock_change, and and change_reason are required'));
        }

        // Check the body, 'stock_change' must be a number
        if (isNaN(productStockLog.stock_change)) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: stock_change must be a number'));
        }

        // Check the change_reason only these values: 'customer_order','manual_adjustment','initial_stock','product_deleted'
        if (!['customer_order', 'manual_adjustment', 'initial_stock', 'product_deleted'].includes(productStockLog.change_reason)) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: change_reason only these values: customer_order, manual_adjustment, initial_stock, product_deleted'));
        }

        // Check the product exist or not
        let checkProduct = await modelProduct.getProductById(db, productStockLog.product_id);
        if (checkProduct.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Product not found!'));
        }

        // Start the transaction
        db.getConnection(function (error, connection) {
            if (error) { // Failed to get connection from pool
                console.log("🚀 ~ connectionError:", error);
                return res.status(500).send(responseWithoutData('error', 'something error'));
            }

            connection.beginTransaction(async function (error) {
                if (error) { // Failed to start transaction
                    console.log("🚀 ~ beginTransactionError:", error);
                    return res.status(500).send(responseWithoutData('error', 'something error'));
                }

                try {
                    // Update the product stock
                    let currentStock = checkProduct[0].stock;
                    let newStock = currentStock + productStockLog.stock_change;

                    let dataProduct = {
                        id: checkProduct[0].id,
                        stock: newStock,
                        updated_at: new Date()
                    }

                    dataProduct = helperModel.getUserRoleUpdate(req.user, dataProduct);

                    await modelProduct.updateProduct(connection, dataProduct);

                    // Create the product stock log
                    let data = {
                        ...productStockLog,
                        stock_change: productStockLog.stock_change,
                        stock_current: newStock,
                        admin_created_id: req.user.id,
                        created_at: new Date()
                    }

                    let createdData = await model.createStockLog(connection, data);
                    createdData = createdData[0];

                    // 2. If commit successful, release connection
                    connection.commit(function (error) {
                        if (error) {
                            console.log("🚀 ~ commitError:", error);
                            return connection.rollback(function () {
                                connection.release(); // Release after rollback due to commit failure
                                return res.status(500).send(responseWithoutData('error', 'something error'));
                            });
                        }

                        connection.release();
                        return res.status(201).send(response('success', 'Product stock log successfully created!', createdData));
                    });
                } catch (error) {
                    console.log("🚀 ~ createProductStockLog ~ error", error);

                    connection.rollback(function () {
                        connection.release(); // Release after rollback due to transaction error
                        return res.status(500).send(responseWithoutData('error', 'something error'));
                    });
                }
            });
        });
    } catch (error) {
        console.log("🚀 ~ createProductStockLog ~ error", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getAllProductStockLogs(req, res) {
    try {
        // Get all product stock logs
        let productStockLogs = await model.getAllStockLogs(db, req.query);

        return res.status(200).send(response('success', 'Successfully get all product stock logs', productStockLogs));
    } catch (error) {
        console.log("🚀 ~ getAllProductStockLogs ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getProductLogsByProductId(req, res) {
    let { params } = req;

    try {
        let productId = params.id;

        // Get the product stock logs by product id
        let productStockLogs = await model.getStockLogsByProductId(db, productId);

        return res.status(200).send(response('success', 'Successfully get product stock logs', productStockLogs));
    } catch (error) {
        console.log("🚀 ~ getProductLogsByProductId ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteProductStockLogPermanent(req, res) {
    let { params } = req;

    try {
        let id = params.id;

        // Check data exist or not
        let checkProductStockLog = await model.getStockLogById(db, id);
        if (checkProductStockLog.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Product stock log not found!'));
        }

        await model.deleteStockLogPermanent(db, id);

        return res.status(200).send(responseWithoutData('success', 'Product stock log deleted permanently!'));
    } catch (error) {
        console.log("🚀 ~ deleteProductStockLogPermanent ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error')); 
    }
}