export function findByAdminId(db, adminId) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admin_login_logs WHERE admin_id = ?", [adminId], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admin_login_logs WHERE id = ?", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function createAdminLoginLogs(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO admin_login_logs SET ?", [data], async function (error, result, fields) {
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