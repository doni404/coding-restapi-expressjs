export function findAll(db, params) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admins WHERE deleted_at IS NULL ORDER BY ? LIMIT ? OFFSET ?", [params.sort.field + " " + params.sort.direction, params.limit, params.offset], function(error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findTotalCount(db) {
    return new Promise((resolve, reject) => {
        db.query("SELECT count(id) as total FROM admins WHERE deleted_at IS NULL", function(error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findByEmail(db, email) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admins WHERE email = ?", [email], function (error, results, fields) {
            if (error) {
                console.error('MySQL query error: ', error);
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findByEmailActive(db, email) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admins WHERE email = ? AND situation = ? AND deleted_at IS NULL", [email, 'active'], function (error, results, fields) {
            if (error) {
                console.error('MySQL query error: ', error);
                reject(error);
            }
            resolve(results);
        });
    });
}

export function findById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admins WHERE id = ? AND deleted_at IS NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function findDeletedById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admins WHERE id = ? AND deleted_at IS NOT NULL", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        })
    });
}

export function createAdmin(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO admins SET ?", [data], async function (error, result, fields) {
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

export function updateAdmin(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE admins SET ? WHERE id = ?", [data, data.id], async function (error, result, fields) {
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

export function deleteAdmin(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE admins SET ? WHERE id = ?", [data, data.id], async function (error, results, fields) {
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

export function deleteAdminPermanent(db, id) {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM admins WHERE id = ?", [id], function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}