import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Service load here if needed
// create reusable transporter object using the default SMTP transport
const transporterSMTP = nodemailer.createTransport({
    port: process.env.SMTP_SERVICE_PORT,               // true for 465, false for other ports
    host: process.env.SMTP_SERVICE_HOST,
    auth: {
        user: process.env.SMTP_USER_EMAIL,
        pass: process.env.SMTP_USER_PASSWORD,
    },
    secure: true,
});

export { transporterSMTP };