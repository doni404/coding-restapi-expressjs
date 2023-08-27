export function findAll(db, params) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM product_stock_logs ORDER BY ? LIMIT ? OFFSET ?", [params.sort.filed + " " + params.sort.direction, params.limit, params.offset], function(error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findTotalCount(db) {
    return new Promise((resolve, reject) => {
        db.query("SELECT count(id) as total FROM product_stock_logs", function(error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM product_stock_logs WHERE id = ?", [id], function(error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findByProductId(db, productId) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM product_stock_logs WHERE product_id = ?", [productId], function(error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function createLog(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO product_stock_logs SET ?", [data], async function (error, result, fields) {
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

export function deleteLogPermanent(db, id) {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM product_stock_logs WHERE id = ?", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}