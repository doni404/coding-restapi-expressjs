import { queryParamGenerator } from '../utils/helper_model.js';

export function getAllAdminRoles(db, queryParams) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM admin_roles WHERE deleted_at IS NULL ' + queryParamGenerator(queryParams), function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function getAdminRoleById(db, id) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM admin_roles WHERE id = ? AND deleted_at IS NULL', id, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function getAdminRoleDeleted(db, id) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM admin_roles WHERE id = ? AND deleted_at IS NOT NULL', id, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function createAdminRole(db, data) {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO admin_roles SET ?', data, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function updateAdminRole(db, data) {
    return new Promise((resolve, reject) => {
        db.query('UPDATE admin_roles SET ? WHERE id = ?', [data, data.id], function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function deleteAdminRole(db, data) {
    return new Promise((resolve, reject) => {
        db.query('UPDATE admin_roles SET ? WHERE id = ?', [data, data.id], function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function deleteAdminRolePermanently(db, id) {
    return new Promise((resolve, reject) => {
        db.query('DELETE FROM admin_roles WHERE id = ?', id, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}