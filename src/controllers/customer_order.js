import * as model from '../models/customer_order.js';
import * as modelProduct from '../models/product.js';
import * as modelProductStockLog from '../models/product_stock_log.js';
import * as modelCustomerOrderItem from '../models/customer_order_item.js';
import * as modelCustomerStore from '../models/customer_store.js';
import db from '../configs/db.js';
import dotenv from 'dotenv';
import { response, responseWithoutData } from '../utils/helper_response.js';

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

export async function createCustomerOrder(req, res) {
    const { customer_store_id, price, tax, items } = req.body;

    if (customer_store_id === undefined || !price || tax === undefined) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    if (!Array.isArray(items)) {
        return res.status(400).send(responseWithoutData('error', 'Invalid items format'));
    }

    try {
        // Check the customer store exist or not
        let checkCustomerStore = await modelCustomerStore.findById(db, customer_store_id);

        if (checkCustomerStore.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer Store doesn\'t exist'));
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
                    // Create the customer order
                    let createdCustomerOrder = (await model.createCustomerOrder(connection, data))[0];

                    // Create all customer order items
                    for (let item of orderItems) {
                        item = {
                            ...item,
                            customer_order_id: createdCustomerOrder.id,
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

                        // Check stock availability, if available minus the product stock 
                        if (item.quantity > checkProduct[0].stock) {
                            return connection.rollback(function () {
                                return res.status(400).send(responseWithoutData('error', 'Some of the products have insufficient stock'))
                            });
                        }

                        checkProduct[0].stock -= item.quantity;
                        checkProduct = await modelProduct.updateProduct(connection, checkProduct[0]);

                        // Create product stock log
                        let dataLog = {
                            product_id: item.product_id,
                            customer_order_id: createCustomerOrder.id,
                            quantity: (item.quantity * -1),
                            current_stock: checkProduct[0].stock,
                            note: "Customer Order " + createCustomerOrder.order_number,
                            admin_created_id: adminWhoCreate,
                            created_at: new Date()
                        }

                        await modelProductStockLog.createLog(connection, dataLog);

                        // Create the items
                        let createdItem = await modelCustomerOrderItem.createCustomerOrderItem(connection, item);

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

                        createdCustomerOrder = {
                            ...createdCustomerOrder,
                            items: orderItemResponses
                        }

                        return res.status(201).send(response('success', 'Customer order successfully created', createdCustomerOrder))
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

export async function getCustomerOrders(req, res) {
    // Parse pagination params using the helper function
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get all customer orders and items inside
        let customerOrders = await model.findAll(db, { limit, offset, sort });

        for (let customerOrder of customerOrders) {
            let customerOrderItems = await modelCustomerOrderItem.findByCustomerOrderId(db, customerOrder.id);

            customerOrder = {
                ...customerOrder,
                items: customerOrderItems
            }
        }

        let totalCO = (await model.findTotalCount(db))[0].total;

        let data = {
            items: customerOrders,
            pagination: {
                totalItems: totalCO,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalCO / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get all customer orders', data));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getCustomerOrder(req, res) {
    const orderNumber = req.params.orderNumber;

    try {
        // Get the customer order by order number
        let customerOrder = await model.findByOrderNumber(db, orderNumber);

        if (customerOrder.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer order not found!'));
        }

        // Check all items in the customer order
        let orderItems = await modelCustomerOrderItem.findByCustomerOrderId(db, customerOrder.id);

        customerOrder = {
            ...customerOrder[0],
            items: orderItems
        }

        return res.status(200).send(response('success', 'Successfully get customer order', customerOrder));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateCustomerOrder(req, res) {
    const customerOrderId = req.params.customerOrderId;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    if (!req.body.customer_store_id) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    if (!Array.isArray(req.body.items)) {
        return res.status(400).send(responseWithoutData('error', 'Invalid items format'));
    }

    try {
        // Check the customer order exist or not
        let checkCustomerOrder = await model.findById(db, customerOrderId);

        if (checkCustomerOrder.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer order not found!'));
        }

        // Check the customer store exist or not
        let checkCustomerStore;
        if (req.body.customer_store_id) {
            checkCustomerStore = await modelCustomerStore.findById(db, req.body.customer_store_id);

            if (checkCustomerStore.length === 0) {
                return res.status(404).send(responseWithoutData('error', 'Customer store not found!'));
            }
        }

        // Get the admin id who update this from token extraction
        let adminWhoUpdate = req.decoded.id;

        let data = {
            id: Number(customerOrderId),
            ...req.body,
            admin_updated_id: adminWhoUpdate,
            updated_at: new Date(),
        }

        if (data.items) {
            delete data['items'];
        }

        // Prepare to update the all order items (using transaction)
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
                    /* Steps
                    1. Check that the order is only in "process" status
                    2. Check product item which need to be updated or just newly added
                    3. Back the stock to the product stock (only for the updated product)
                    4. Create new record in stock log as "Return product stock, reason : update product" (only for the updated product)
                    5. Minus product stock (for both updated and newly added product)
                    6. Create new record in stock log as "New order product stock, reason : update product" (for both updated and newly added product)
                    7. Update the customer order items
                    8. Update the customer order
                    */

                    // 1. Check order status
                    if (checkCustomerOrder[0].situation !== "process") {
                        return connection.rollback(function () {
                            return res.status(500).send(responseWithoutData('error', 'something error : only order with process status can be updated'));
                        });
                    }

                    // 2. Check list of items, separate the updated and newly added
                    for (let item of orderItems) {
                        let checkItemExist = await modelCustomerOrderItem.findByCustomerOrderIdAndProductId(connection, checkCustomerOrder.id, item.product_id);

                        if (checkItemExist.length !== 0) {
                            // Updated
                            // 3. Back the stock to the product stock
                            let product = (await modelProduct.findById(connection, item.product_id))[0];
                            product.stock += checkItemExist[0].quantity;
                            await modelProduct.updateProduct(connection, product);

                            // 4. Create new record stock log return 
                            let dataLog = {
                                product_id: item.product_id,
                                customer_order_id: createCustomerOrder.id,
                                quantity: checkItemExist[0].quantity,
                                current_stock: product.stock,
                                note: "Return customer order " + createCustomerOrder.order_number + ", reason: update product",
                                admin_created_id: adminWhoCreate,
                                created_at: new Date()
                            }

                            await modelProductStockLog.createLog(connection, dataLog);
                        }

                        // 5. Minus product stock (both newly added and updated)
                        let checkProduct = await modelProduct.findById(connection, item.product_id);

                        if (checkProduct.length === 0) {
                            return connection.rollback(function () {
                                return res.status(400).send(responseWithoutData('error', 'Some of the products is not found'));
                            });
                        }

                        if (item.quantity > checkProduct[0].stock) {
                            return connection.rollback(function () {
                                return res.status(400).send(responseWithoutData('error', 'Some of the products have insufficient stock'))
                            });
                        }

                        checkProduct[0].stock -= item.quantity;
                        checkProduct = await modelProduct.updateProduct(connection, checkProduct[0]);

                        // 6. Create new record on product stock log (both newly added and updated)
                        let dataLog = {
                            product_id: item.product_id,
                            customer_order_id: createCustomerOrder.id,
                            quantity: (item.quantity * -1),
                            current_stock: checkProduct[0].stock,
                            note: "Return customer order " + createCustomerOrder.order_number + ", reason: update product",
                            admin_created_id: adminWhoCreate,
                            created_at: new Date()
                        }

                        let createdLog = await modelProductStockLog.createLog(connection, dataLog);

                        if (createdLog.length === 0) {
                            return connection.rollback(function () {
                                return res.status(400).send(responseWithoutData('error', 'Product stock log couldn\'t be created'));
                            });
                        }

                        // 7. Update the customer order items
                        item = {
                            ...item,
                            customer_order_id: updateCustomerOrder.id,
                            admin_updated_id: adminWhoUpdate,
                            updated_at: new Date()
                        }

                        let updatedItem = await modelCustomerOrderItem.updateCustomerOrderItem(connection, item);

                        if (updatedItem.length === 0) {
                            return connection.rollback(function () {
                                return res.status(400).send(responseWithoutData('error', 'Some of the items couldn\'t be updated'));
                            });
                        }

                        orderItemResponses.push(updatedItem[0]);
                    }

                    // 8. Update the customer order
                    let updatedCustomerOrder = (await model.updateCustomerOrder(connection, data))[0];

                    if (updateCustomerOrder.length === 0) {
                        return connection.rollback(function () {
                            return res.status(400).send(responseWithoutData('error', 'Customer order couldn\'t be updated'));
                        });
                    }

                    connection.commit(function (error) {
                        if (error) {
                            return connection.rollback(function () {
                                return res.status(500).send(responseWithoutData('error', 'something error when commit transaction'))
                            });
                        }

                        updatedCustomerOrder = {
                            ...updatedCustomerOrder,
                            items: orderItemResponses
                        }

                        return res.status(200).send(response('success', 'Customer order successfully updated', updatedCustomerOrder))
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

export async function reconcileCustomerOrder(req, res) {
    const customerOrderId = req.params.customerOrderId;

    
}

export async function deleteCustomerOrder(req, res) {
    const customerOrderId = req.params.customerOrderId;

    try {
        // check the customer order exist or not
        let checkCustomerOrder = await model.findById(db, customerOrderId);

        if (checkCustomerOrder.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer order not found!'));
        }

        // Get the admin id who delete this from token extraction
        let adminWhoDelete = req.decoded.id;

        let data = {
            id: customerOrderId,
            admin_deleted_id: adminWhoDelete,
            deleted_at: new Date()
        }

        let deleteCO = await model.deleteCustomerOrder(db, data);
        return res.status(200).send(response('sucess', 'Customer order successfully deleted !', deleteCO[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteCustomerOrderPermanent(req, res) {
    const id = req.params.customerOrderId;

    try {
        let checkCO = await model.findDeletedById(db, id);

        if (checkCO.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer order can\'t be deleted permanently!'));
        }

        checkCO = checkCO[0];

        await model.deleteCustomerOrderPermanent(db, id);
        return res.status(200).send(responseWithoutData('success', 'Customer order deleted permanently!'));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}