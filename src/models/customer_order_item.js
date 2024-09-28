export function findById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_order_items WHERE id = ? AND deleted_at IS NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findByCustomerOrderId(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_order_items WHERE customer_order_id = ? AND deleted_at IS NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findByCustomerOrderIdAndProductId(db, coId, pId) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_order_items WHERE customer_order_id = ? AND product_id = ? AND deleted_at IS NULL", [coId, pId], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findDeletedById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_order_items WHERE id = ? AND deleted_at IS NOT NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function createCustomerOrderItem(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO customer_order_items SET ?", [data], async function (error, result, fields) {
            if (error) {
                reject(error);
            }

            // Get last inserted data to return
            let insertedData = await findById(db, result.insertId);
            if (insertedData.length !== 0) {
                resolve(insertedData);
            }

            resolve(result);
        });
    });
}

export function updateCustomerOrderItem(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE customer_order_items SET ? WHERE id = ?", [data, data.id], async function (error, result, fields) {
            if (error) {
                reject(error);
            }

            // Get last updated data to return
            let updatedData = await findById(db, data.id);
            if (updatedData.length !== 0) {
                resolve(updatedData);
            }

            resolve(result);
        });
    });
}

export function deleteCustomerStore(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE customer_order_items SET ? WHERE id = ?", [data, data.id], async function (error, results, fields) {
            if (error) {
                reject(error);
            }

            // Get last deleted data to return
            let deletedData = await findDeletedById(db, data.id);
            if (deletedData.length !== 0) {
                resolve(deletedData);
            }

            resolve(results);
        });
    });
}

export function deleteCustomerStorePermanent(db, id) {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM customer_order_items WHERE id = ?", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}