export function findByEmail(db, email) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM admins WHERE email = ?', [email], (error, results) => {
            if (error) {
                console.error('MySQL query error: ', error);
                reject(error);
            }
            resolve(results);
        });
    });
}