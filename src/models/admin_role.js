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
        db.query('INSERT INTO admin_roles SET ?', data, async function (err, result, fields) {
            if (err) {
                reject(err);
            }

            // Get last inserted data to return
            let insertedData = await getAdminRoleById(db, result.insertId);
            if (insertedData.length !== 0) {
                resolve(insertedData);
            }

            resolve(result);
        });
    });
}

export function updateAdminRole(db, data) {
    return new Promise((resolve, reject) => {
        db.query('UPDATE admin_roles SET ? WHERE id = ?', [data, data.id], async function (err, result, fields) {
            if (err) {
                reject(err);
            }

            // Get last updated data to return
            let updatedData = await getAdminRoleById(db, data.id);
            if (updatedData.length !== 0) {
                resolve(updatedData);
            }

            resolve(result);
        });
    });
}

export function deleteAdminRole(db, data) {
    return new Promise((resolve, reject) => {
        db.query('UPDATE admin_roles SET ? WHERE id = ?', [data, data.id], async function (err, result, fields) {
            if (err) {
                reject(err);
            }

            // Get last deleted data to return
            let deletedData = await getAdminRoleDeleted(db, data.id);
            if (deletedData.length !== 0) {
                resolve(deletedData);
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