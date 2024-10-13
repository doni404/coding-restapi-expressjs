import * as model from '../models/supplier_order.js';
import * as modelItem from '../models/supplier_order_item.js';
import * as modelSupplier from '../models/supplier.js';
import * as modelProduct from '../models/product.js';
import * as modelProductStockLog from '../models/product_stock_log.js';
import db from '../configs/dbClient.js';
import dotenv from 'dotenv';
import { response, responseWithoutData } from '../utils/helper_response.js';
import { getPaginationParams } from '../utils/helper_query.js';
import dayjs from 'dayjs'
// import { randomString } from '../utils/helper_string.js'

// Load environment variables from .env
dotenv.config({ path: './.env' });

async function generateOrderNumber(orderNumber) {
    let isOrderNumberAvailable = false
    let count = 0
    do {
        count++
        let orders = await model.findByOrderNumber(db, orderNumber)
        if (orders.length === 0) {
            isOrderNumberAvailable = true
        } else {
            orderNumber = dayjs().format('YYMMDD') + "-" + randomString(8, '#A')
        }
    } while (isOrderNumberAvailable == false)

    return orderNumber
}

export async function createSupplierOrder(req, res) {
    const { supplier_id, price, tax, shipping_fee, zip, prefecture, city, address, payment_method, items } = req.body;

    if (supplier_id === undefined || tax === undefined || !price || !shipping_fee || !zip || !prefecture || !city || !address || !payment_method || !items) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    if (!Array.isArray(items)) {
        return res.status(400).send(responseWithoutData('error', 'Invalid items format'));
    }

    try {
        // Check the supplier exist or not
        let checkSupplier = await modelSupplier.findById(db, supplier_id);

        if (checkSupplier.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Supplier doesn\'t exist'));
        }

        // Generate order number
        let orderNumber = await generateOrderNumber(dayjs().format('YYMMDD') + "-" + randomString(8, '#A'));

        // Get the admin id who create this from token extraction and prepare data orders
        let adminWhoCreate = req.decoded.id;

        let data = {
            ...req.body,
            order_number: orderNumber,
            admin_created_id: adminWhoCreate,
            created_at: new Date(),
            admin_updated_id: adminWhoCreate,
            updated_at: new Date()
        }

        if (data.items) {
            delete data['items'];
        }

        // Prepare to create the all order items first then create the order (using transaction)
        let orderItems = req.body.items;
        let orderItemResponses = [];

        db.getConnection(function (error, connection) {
            if (error) {
                return res.status(500).send(responseWithoutData('error', 'something error with connection'));
            }

            // Start transaction
            connection.beginTransaction(async function (error) {
                if (error) {
                    return res.status(500).send(responseWithoutData('error', 'something error with transaction'))
                }

                try {
                    // Create the supplier order
                    let createdSupplierOrder = (await model.createSupplierOrder(connection, data))[0];

                    // Create all supplier order items
                    for (let item of orderItems) {
                        item = {
                            ...item,
                            supplier_order_id: createdSupplierOrder.id,
                            admin_created_id: adminWhoCreate,
                            created_at: new Date(),
                            admin_updated_id: adminWhoCreate,
                            updated_at: new Date()
                        }

                        // Check product stock exist or not
                        let checkProduct = await modelProduct.findById(connection, item.product_id);

                        if (checkProduct.length === 0) {
                            return connection.rollback(function () {
                                return res.status(400).send(responseWithoutData('error', 'Some of the products is not found'));
                            });
                        }

                        // if (item.quantity > checkProduct[0].stock) {
                        //     return connection.rollback(function() {
                        //         return res.status(400).send(responseWithoutData('error', 'Some of the products have insufficient stock'))
                        //     });
                        // }

                        // Create the items
                        let createdItem = await modelItem.createSupplierOrderItem(connection, item);

                        if (createdItem.length === 0) {
                            return connection.rollback(function () {
                                return res.status(400).send(responseWithoutData('error', 'Some of the items couldn\'t be created'));
                            });
                        }

                        orderItemResponses.push(createdItem[0]);
                    }

                    connection.commit(function (error) {
                        if (error) {
                            return connection.rollback(function () {
                                return res.status(500).send(responseWithoutData('error', 'something error when commit transaction'))
                            });
                        }

                        createdSupplierOrder = {
                            ...createdSupplierOrder,
                            items: orderItemResponses
                        }

                        return res.status(201).send(response('success', 'Supplier order successfully created', createdSupplierOrder))
                    });
                } catch (error) {
                    return connection.rollback(function () {
                        return res.status(500).send(responseWithoutData('error', 'something error within transaction'));
                    });
                }
            });
        });
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getSupplierOrders(req, res) {
    // Parse pagination params using the helper function
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get all supplier orders and items inside
        let supplierOrders = await model.findAll(db, { limit, offset, sort });

        for (let supplierOrder of supplierOrders) {
            let supplierOrderItems = await modelItem.findBySupplierOrderId(db, supplierOrder.id);

            supplierOrder = {
                ...supplierOrder,
                items: supplierOrderItems
            }
        }

        let totalSO = (await model.findTotalCount(db))[0].total;

        let data = {
            items: supplierOrders,
            pagination: {
                totalItems: totalSO,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalSO / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get all supplier orders', data));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getSupplierOrder(req, res) {
    const orderNumber = req.params.orderNumber;

    try {
        // Get the supplier order by order number
        let supplierOrder = await model.findByOrderNumber(db, orderNumber);

        if (supplierOrder.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Supplier order not found!'));
        }

        // Check all items in the supplier order
        let orderItems = await modelItem.findBySupplierOrderId(db, supplierOrder.id);

        supplierOrder = {
            ...supplierOrder[0],
            items: orderItems
        }

        return res.status(200).send(response('success', 'Successfully get supplier order', supplierOrder));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateSupplierOrderSituation(req, res) {
    const id = req.params.supplierOrderId;
    const { situation } = req.body;

    if (!situation) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Check the supplier order
        let checkSupplierOrder = await model.findById(db, id);

        if (checkSupplierOrder.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Supplier order not found!'));
        }

        // Get all items on the order
        let SOItems = await modelItem.findBySupplierOrderId(db, checkSupplierOrder[0].id);

        checkSupplierOrder[0] = {
            ...checkSupplierOrder[0],
            items: SOItems
        }

        // Get the admin id who create this from token extraction and prepare data orders
        let adminWhoUpdate = req.decoded.id;

        db.getConnection(function (error, connection) {
            if (error) {
                return res.status(500).send(responseWithoutData('error', 'something error with connection'));
            }

            // Start transaction
            connection.beginTransaction(async function (error) {
                if (error) {
                    return res.status(500).send(responseWithoutData('error', 'something error with transaction'))
                }

                try {
                    // Check the situation from "processed," to "canceled," or "delivered," or "picked_up."
                    switch (situation) {
                        case "delivered":
                            checkSupplierOrder[0].situation = "delivered";
                            checkSupplierOrder[0].delivered_date = new Date();

                            // Create record on product stock log (history) & update stock on product
                            for (let item of checkSupplierOrder[0].items) {
                                // Get product from item
                                let checkProduct = await modelProduct.findById(connection, item.product_id);

                                if (checkProduct.length === 0) {
                                    return connection.rollback(function () {
                                        return res.status(400).send(responseWithoutData('error', 'Some of the products is not found'));
                                    });
                                }

                                // Create product stock log
                                let quantity = Number(item.quantity);
                                let totalStock = Number(checkProduct[0].stock) + quantity;

                                let productStockLogdata = {
                                    product_id: item.product_id,
                                    supplier_order_id: checkSupplierOrder.id,
                                    quantity: quantity,
                                    current_stock: totalStock,
                                    type: 'supplier',
                                    note: "Supplier Order (" + checkSupplierOrder.order_number + ")",
                                    admin_created_id: adminWhoUpdate,
                                    created_at: new Date()
                                }

                                await modelProductStockLog.createLog(connection, productStockLogdata);

                                // Update stock on product
                                let productUpdateData = {
                                    id: item.product_id,
                                    stock: totalStock,
                                    admin_updated_id: adminWhoUpdate,
                                    updated_at: new Date()
                                }

                                await modelProduct.updateProduct(connection, productUpdateData);
                            }

                            break;
                        case "picked_up":
                            checkSupplierOrder[0].situation = "picked_up";
                            break;
                        case "canceled":
                            // Check only if the order still process
                            if (checkSupplierOrder[0].situation === "processed") {
                                checkSupplierOrder[0].situation = "canceled";
                                checkSupplierOrder[0].canceled_date = new Date();
                            } else {
                                return connection.rollback(function () {
                                    return res.status(400).send(responseWithoutData('error', 'can only change to canceled when it still processed'));
                                });
                            }

                            break;
                        default:
                            break;
                    }

                    checkSupplierOrder[0].admin_updated_id = adminWhoUpdate;
                    checkSupplierOrder[0].updated_at = new Date();

                    if (checkSupplierOrder[0].items) {
                        delete checkSupplierOrder[0]['items'];
                    }

                    let updatedSupplierOrder = await model.updateSupplierOrder(db, checkSupplierOrder[0]);
                    updatedSupplierOrder[0] = {
                        ...updatedSupplierOrder[0],
                        items: SOItems
                    }

                    connection.commit(function (error) {
                        if (error) {
                            return connection.rollback(function () {
                                return res.status(500).send(responseWithoutData('error', 'something error when commit transaction'))
                            });
                        }

                        return res.status(200).send(response('success', 'Successfully update supplier order situation', updatedSupplierOrder[0]));
                    });
                } catch (error) {
                    return connection.rollback(function () {
                        return res.status(500).send(responseWithoutData('error', 'something error within transaction'));
                    });
                }
            });
        });
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateSupplierOrder(req, res) {
    const supplierOrderId = req.params.supplierOrderId;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    if (!Array.isArray(req.body.items)) {
        return res.status(400).send(responseWithoutData('error', 'Invalid items format'));
    }

    try {
        // Check the supplier order exist or not
        let checkSupplierOrder = await model.findById(db, supplierOrderId);

        if (checkSupplierOrder.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Supplier order not found!'));
        }

        // Check the supplier exist or not
        let checkSupplier;
        if (req.body.supplier_id) {
            checkSupplier = await modelSupplier.findById(db, req.body.supplier_id);

            if (checkSupplier.length === 0) {
                return res.status(404).send(responseWithoutData('error', 'Supplier not found!'));
            }
        }

        // Get the admin id who update this from token extraction
        let adminWhoUpdate = req.decoded.id;

        let data = {
            id: Number(supplierOrderId),
            ...req.body,
            admin_updated_id: adminWhoUpdate,
            updated_at: new Date(),
        }

        if (data.items) {
            delete data['items'];
        }

        // Prepare to create the all order items first then create the order (using transaction)
        let orderItems = req.body.items;
        let orderItemResponses = [];

        // Start the db connection
        db.getConnection(function (error, connection) {
            if (error) {
                return res.status(500).send(responseWithoutData('error', 'something error with connection'));
            }

            // Start transaction
            connection.beginTransaction(async function (error) {
                if (error) {
                    return res.status(500).send(responseWithoutData('error', 'something error with transaction'))
                }

                try {
                    // Update the supplier order
                    let updatedSupplierOrder = (await model.updateSupplierOrder(connection, data))[0];

                    // Update all supplier order items
                    for (let item of orderItems) {
                        item = {
                            ...item,
                            supplier_order_id: updatedSupplierOrder.id,
                            admin_updated_id: adminWhoUpdate,
                            updated_at: new Date()
                        }

                        // Check product stock exist or not
                        let checkProduct = await modelProduct.findById(connection, item.product_id);

                        if (checkProduct.length === 0) {
                            return connection.rollback(function () {
                                return res.status(400).send(responseWithoutData('error', 'Some of the products is not found'));
                            });
                        }

                        // Update the items
                        let updatedItem = await modelItem.updateSupplierOrderItem(connection, item);

                        if (updatedItem.length === 0) {
                            return connection.rollback(function () {
                                return res.status(400).send(responseWithoutData('error', 'Some of the items couldn\'t be updated'));
                            });
                        }

                        orderItemResponses.push(updatedItem[0]);
                    }

                    connection.commit(function (error) {
                        if (error) {
                            return connection.rollback(function () {
                                return res.status(500).send(responseWithoutData('error', 'something error when commit transaction'))
                            });
                        }

                        updatedSupplierOrder = {
                            ...updatedSupplierOrder,
                            items: orderItemResponses
                        }

                        return res.status(200).send(response('success', 'Supplier order successfully updated', updatedSupplierOrder))
                    });
                } catch (error) {
                    return connection.rollback(function () {
                        return res.status(500).send(responseWithoutData('error', 'something error within transaction'));
                    });
                }
            });
        });
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteSupplierOrder(req, res) {
    const supplierOrderId = req.params.supplierOrderId;

    try {
        // check the supplier order exist or not
        let checkSupplierOrder = await model.findById(db, supplierOrderId);

        if (checkSupplierOrder.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Supplier order not found!'));
        }

        // Get the admin id who delete this from token extraction
        let adminWhoDelete = req.decoded.id;

        let data = {
            id: supplierOrderId,
            situation: 'inactive',
            admin_deleted_id: adminWhoDelete,
            deleted_at: new Date()
        }

        let deleteSO = await model.deleteSupplierOrder(db, data);
        return res.status(200).send(response('sucess', 'Supplier order successfully deleted !', deleteSO[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteSupplierOrderPermanent(req, res) {
    const id = req.params.supplierOrderId;

    try {
        let checkSO = await model.findDeletedById(db, id);

        if (checkSO.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Supplier order can\'t be deleted permanently!'));
        }

        checkSO = checkSO[0];

        await model.deleteSupplierOrderPermanent(db, id);
        return res.status(200).send(responseWithoutData('success', 'Supplier order deleted permanently!'));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}