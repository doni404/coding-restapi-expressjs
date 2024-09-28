export function findAll(db, params) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_orders WHERE deleted_at IS NULL ORDER BY ? LIMIT ? OFFSET ?", [params.sort.field + " " + params.sort.direction, params.limit, params.offset], function(error, results, fields) {
            if(error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findTotalCount(db) {
    return new Promise((resolve, reject) => {
        db.query("SELECT count(id) as total FROM customer_orders WHERE deleted_at IS NULL", function(error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_orders WHERE id = ? AND deleted_at IS NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findDeletedById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_orders WHERE id = ? AND deleted_at IS NOT NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findByOrderNumber(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_orders WHERE order_number = ? AND deleted_at IS NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findByCustomerStoreId(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_orders WHERE customer_store_id = ? AND deleted_at IS NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function createCustomerOrder(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO customer_orders SET ?", [data], async function (error, result, fields) {
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

export function updateCustomerOrder(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE customer_orders SET ? WHERE id = ?", [data, data.id], async function (error, result, fields) {
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

export function deleteCustomerOrder(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE customer_orders SET ? WHERE id = ?", [data, data.id], async function (error, results, fields) {
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

export function deleteCustomerOrderPermanent(db, id) {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM customer_orders WHERE id = ?", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}