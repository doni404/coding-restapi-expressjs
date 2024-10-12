import { queryParamGenerator } from '../utils/helper_model.js';

export function getAdminLoginLogsById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admin_login_logs WHERE id = ?", id, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function getAdminLoginLogsByAdminId(db, adminId, queryParams) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM admin_login_logs WHERE admin_id = ? " + queryParamGenerator(queryParams), adminId, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

export function createAdminLoginLog(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO admin_login_logs SET ?", data, function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}