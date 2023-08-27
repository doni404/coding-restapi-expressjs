export function findAll(db, params) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM products WHERE deleted_at IS NULL ORDER BY ? LIMIT ? OFFSET ?", [params.sort.field + " " + params.sort.direction, params.limit, params.offset], function(error, results, fields) {
            if(error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findTotalCount(db) {
    return new Promise((resolve, reject) => {
        db.query("SELECT count(id) as total FROM products WHERE deleted_at IS NULL", function(error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM products WHERE id = ? AND deleted_at IS NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findByCode(db, code) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM products WHERE code = ? AND deleted_at IS NULL", [code], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findDeletedById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM products WHERE id = ? AND deleted_at IS NOT NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function createProduct(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO products SET ?", [data], async function (error, result, fields) {
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

export function updateProduct(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE products SET ? WHERE id = ?", [data, data.id], async function (error, result, fields) {
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

export function deleteProduct(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE products SET ? WHERE id = ?", [data, data.id], async function (error, results, fields) {
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

export function deleteProductPermanent(db, id) {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM products WHERE id = ?", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}