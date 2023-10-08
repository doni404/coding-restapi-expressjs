export function findAll(db, params) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_product_prices WHERE deleted_at IS NULL ORDER BY ? LIMIT ? OFFSET ?", [params.sort.field + " " + params.sort.direction, params.limit, params.offset], function(error, results, fields) {
            if(error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findTotalCount(db) {
    return new Promise((resolve, reject) => {
        db.query("SELECT count(id) as total FROM customer_product_prices WHERE deleted_at IS NULL", function(error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_product_prices WHERE id = ? AND deleted_at IS NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findDeletedById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_product_prices WHERE id = ? AND deleted_at IS NOT NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findByProductId(db, id, params) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_product_prices WHERE product_id = ? AND deleted_at IS NULL ORDER BY ? LIMIT ? OFFSET ?", [id, params.sort.field + " " + params.sort.direction, params.limit, params.offset], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findByCustomerStoreId(db, id, params) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_product_prices WHERE customer_store_id = ? AND deleted_at IS NULL ORDER BY ? LIMIT ? OFFSET ?", [id, params.sort.field + " " + params.sort.direction, params.limit, params.offset], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findActiveByCustomerStoreId(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_product_prices WHERE customer_store_id = ? AND deleted_at IS NULL ORDER BY id DESC LIMIT 1", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function createCustomerProductPrice(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO customer_product_prices SET ?", [data], async function (error, result, fields) {
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

export function updateCustomerProductPrice(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE customer_product_prices SET ? WHERE id = ?", [data, data.id], async function (error, result, fields) {
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

export function deleteCustomerProductPrice(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE customer_product_prices SET ? WHERE id = ?", [data, data.id], async function (error, results, fields) {
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

export function deleteCustomerProductPricePermanent(db, id) {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM customer_product_prices WHERE id = ?", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}