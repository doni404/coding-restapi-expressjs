export function findByCustomerId(db, adminId) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_login_logs WHERE customer_id = ?", [adminId], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM customer_login_logs WHERE id = ?", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function createCustomerLoginLogs(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO customer_login_logs SET ?", [data], async function (error, result, fields) {
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