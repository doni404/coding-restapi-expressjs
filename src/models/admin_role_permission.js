export function getAdminRolePermissionByRoleId(db, roleId) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admin_role_permissions WHERE admin_role_id = ?", roleId, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function getPermissionIdListByRoleId(db, roleId) {
    return new Promise((resolve, reject) => {
        db.query("SELECT admin_permission_id FROM admin_role_permissions WHERE admin_role_id = ?", roleId, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function getAdminRolePermissionById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admin_role_permissions WHERE id = ?", id, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function checkAdminRolePermissionExist(db, data) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admin_role_permissions WHERE admin_role_id = ? AND admin_permission_id = ?", [data.roleId, data.permissionId], function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function createAdminRolePermission(db, data) {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO admin_role_permissions SET ?', data, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function deleteAdminRolePermission(db, id) {
    return new Promise((resolve, reject) => {
        db.query('DELETE FROM admin_role_permissions WHERE id = ?', id, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function deleteAdminRolePermissionByRolePermission(db, data) {
    return new Promise((resolve, reject) => {
        db.query('DELETE FROM admin_role_permissions WHERE admin_role_id = ? AND admin_permission_id = ?', [data.roleId, data.permissionId], function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}