import mysql from 'mysql';
import dotenv from 'dotenv';

dotenv.config();

const conn = mysql.createPool({
    connectionLimit: 100,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    waitForConnections: true,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    collate: 'utf8mb4_bin',
    dateStrings: [
        'DATE',
        'DATETIME'
    ]
});

export default conn;