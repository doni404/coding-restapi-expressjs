import { queryParamGenerator } from '../utils/helper_model.js';

export function getAllProducts(db, queryParams) {
    let queryClause = ``

    // Process condition query based on queryParams
    if (Object.keys(queryParams).length > 0) {
        for (let [key, value] of Object.entries(queryParams)) {
            let exclude = ['sort_by', 'limit', 'offset']
            if (key === 'keyword') {
                queryClause += queryClause.length > 0 ? " AND " : ""
                queryClause += ` (LOWER(code) LIKE LOWER('%${value}%') OR LOWER(name) LIKE LOWER('%${value}%') OR LOWER(description) LIKE LOWER('%${value}%'))`
            } else if (!exclude.includes(key)) {
                if (isInteger(value)) {
                    queryClause += queryClause.length > 0 ? " AND " : ""
                    queryClause += ` ${key} = ${value}`
                } else {
                    queryClause += queryClause.length > 0 ? " AND " : ""
                    queryClause += ` ${key} = '${value}'`
                }
            }
        }
    }

    // Append query clause to query
    if (queryClause.length > 0) {
        queryClause = ` AND ${queryClause}`
    }

    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM products WHERE deleted_at IS NULL ${queryClause}` + queryParamGenerator(queryParams), function(error, results, fields) {
            if(error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function getTotalCount(db) {
    return new Promise((resolve, reject) => {
        db.query("SELECT count(id) as total FROM products WHERE deleted_at IS NULL", function(error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function getProductById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM products WHERE id = ? AND deleted_at IS NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function getProductByCode(db, code) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM products WHERE code = ? AND deleted_at IS NULL", [code], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function getProductDeleted(db, id) {
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
            let insertedData = await getProductById(db, result.insertId);
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
            let updatedData = await getProductById(db, data.id);
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
            let deletedData = await getProductDeleted(db, data.id);
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