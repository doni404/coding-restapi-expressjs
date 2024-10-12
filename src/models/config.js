export function getAllConfigs(db) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM configs", function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function getConfigById(db, id) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM configs WHERE id = ?", [id], function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function createConfig(db, data) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO configs SET ?", data, function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function updateConfig(db, data) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE configs SET ? WHERE id = ?", [data, data.id], function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}

export function deleteConfigPermanently(db, id) {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM configs WHERE id = ?", id, function (err, result, fields) {
            if (err) {
                reject(err)
            }
            resolve(result)
        })
    })
}