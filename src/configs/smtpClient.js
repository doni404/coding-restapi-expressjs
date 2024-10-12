import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/* 
This module sets up an SMTP client using the nodemailer library and configuration 
from environment variables. It exports the configured smtpClient for sending emails.
*/

const smtpClient = nodemailer.createTransport({
    port: process.env.SMTP_SERVICE_PORT,               // true for 465, false for other ports
    host: process.env.SMTP_SERVICE_HOST,
    auth: {
        user: process.env.SMTP_USER_EMAIL,
        pass: process.env.SMTP_USER_PASSWORD,
    },
    secure: true,
}); 

export { smtpClient };