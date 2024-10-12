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
        db.query('INSERT INTO admin_permissions SET ?', data, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function deleteAdminPermission(db, id) {
    return new Promise((resolve, reject) => {
        db.query('DELETE FROM admin_permissions WHERE id = ?', id, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}