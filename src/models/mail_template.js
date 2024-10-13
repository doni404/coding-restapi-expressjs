import { queryParamGenerator } from '../utils/helper_model.js'

export function getAllMailTemplates(db, queryParams) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM mail_templates WHERE deleted_at IS NULL " + queryParamGenerator(queryParams), function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function getMailTemplateBySlug(db, slug) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM mail_templates WHERE LOWER(slug) = LOWER(?) AND deleted_at IS NULL", slug, function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function getMailTemplateById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM mail_templates WHERE id = ? AND deleted_at IS NULL", id, function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function getMailTemplateDeleted(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM mail_templates WHERE id = ? AND deleted_at IS NOT NULL", id, function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function createMailTemplate(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO mail_templates SET ?", data, function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function updateMailTemplate(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE mail_templates SET ? WHERE id = ?", [data, data.id], function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function deleteMailTemplate(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE mail_templates SET ? WHERE id = ?", [data, data.id], function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function deleteMailTemplatePermanently(db, id) {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM mail_templates WHERE id = ?", id, function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}