import { queryParamGenerator } from '../utils/helper_model.js';

export function getAllAdminPermissions(db, queryParams) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admin_permissions WHERE situation = 'active' " + queryParamGenerator(queryParams), function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function getAdminPermissionById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admin_permissions WHERE id = ?", id, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function createAdminPermission(db, data) {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO admin_permissions SET ?', data, async function (err, result, fields) {
            if (err) {
                reject(err);
            }

            // Get last inserted data to return
            let insertedData = await getAdminPermissionById(db, result.insertId);
            if (insertedData.length !== 0) {
                resolve(insertedData);
            }

            resolve(result);
        });
    });
}

export function deleteAdminPermission(db, id) {
    return new Promise((resolve, reject) => {
        db.query('DELETE FROM admin_permissions WHERE id = ?', id, async function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}