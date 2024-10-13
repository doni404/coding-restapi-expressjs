import dotenv from 'dotenv';
import { smtpClient } from '../configs/smtpClient.js';
import { getEmailAdmin, getEmailSender } from '../controllers/config.js'
import * as admin from './mail_templates/template_admin.js';

export { admin }

export let option = { fontSize: '13px' }

// Load environment variables from .env
dotenv.config({ path: './.env' });

export let baseUrl = {
	baseUrlEC: process.env.BASE_URL_PUBLIC,
	baseUrlCMS: process.env.BASE_URL_CMS,
	baseUrlAPI: process.env.BASE_URL_API
}

export async function sendEmail(toAddress, subject, body) {
    let fromAddress = await getEmailSender();  // Ensure you have a valid email sender

    console.log('fromAddress:', fromAddress);
    console.log('toAddress:', toAddress);
    console.log('subject:', subject);
    console.log('body:', body);

    const mailData = {
        // from: `Coconut Pudding <${fromAddress}>`,  // Add friendly name here
        from: fromAddress,  // Sender email
		to: toAddress,      // Recipient email
        subject: subject,   // Subject of the email
        html: body,         // Email content (HTML format)
    };

    try {
        // Use promise to send email and return the result to the caller
        let info = await smtpClient.sendMail(mailData);
        return { success: true, message: info.response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export function getHeader() {
    let { baseUrlEC, baseUrlCMS, baseUrlAPI } = baseUrl;

    return `<html lang='en'> 
	<head>
	<meta charset='UTF-8' />
	<meta http-equiv='X-UA-Compatible' content='IE=edge' />
	<meta name='viewport' content='width=device-width, initial-scale=1.0' />
	<title>Auto Email</title>
	</head>

	<body>
	<table style='width: 95%; max-width: 950px; margin: auto; color: #202c45;font-family: 'DM Sans', Helvetica, Arial, sans-serif;'>
	<tbody><tr>
	<td style='font-size: 13px;' align='left' valign='top' width='98%'>
	<table style='width: 100%;'>

	${ /* <!-- TOP SECTION --> */''}
	<tr><td>
	<table border='0' cellspacing='0' cellpadding='0' style='width: 100%;'>
	<tr><td>
	<div style='width: 100%; max-width: 280px; margin: 0 auto; padding-top: 30px;'>
	<img src='${baseUrlAPI}/v1/public/resources/img/logo.png' style='width: 100%; max-width: 280px;' />
	</div><br />
	<hr style='border-style: solid; border-width: 1px; border-color: #c0c0c0;width: 100%;' /><br />
	</td></tr>
	</table>
	</td></tr>`
}

export function getFooter(footerInfo, option = {}) {
    let { baseUrlEC, baseUrlCMS, baseUrlAPI } = footerInfo

    return `${ /* <!-- BOTTOM SECTION --> */''}
	<tr><td>
	<table border='0' cellspacing='0' cellpadding='0' style='width: 100%;line-height: 22px;'>
	<br /><hr style='border-style: solid; border-width: 1px; border-color: #c0c0c0;width: 100%;' /><br />
	</td></tr>

	<tr><td>
	<div style='text-align: center; font-size: 13px;'>
	<a href='${baseUrlEC}/terms' style='color: #960000; text-decoration: none; font-weight: 500;'>Terms</a>
	<span style='color: #6b6b6b; margin: 0 10px;font-size: 18px;vertical-align: middle;'>&#8226;</span>
	<a href='${baseUrlEC}/privacy-policy' style='color: #960000; text-decoration: none; font-weight: 500;'>Privacy Policy</a>
	<span style='color: #6b6b6b; margin: 0 10px;font-size: 18px;vertical-align: middle;'>&#8226;</span>
	<a href='${baseUrlEC}/contact' style='color: #960000; text-decoration: none; font-weight: 500;'>Inquiry</a>
	</div>
	</td></tr>

	<tr><td>
	<table border='0' cellspacing='0' cellpadding='0' style='margin: 16px auto 12px; text-align: center; width: 100%'
	<tr>
	<td style='text-align: right; width: calc(50% - 63px)'>
	<a href='https://www.instagram.com/coconutpudding.official' target='_blank'><img src='${baseUrlAPI}/v1/public/resources/img/sns-fb-gray.png' alt='facebook' style='width: 30px;opacity: 0.65;' /></a>
	</td> 
	<td style='text-align: center; width: 63px'>
	<a href='https://www.instagram.com/coconutpudding.official' target='_blank'><img src='${baseUrlAPI}/v1/public/resources/img/sns-ig-gray.png' alt='instagram' style='width: 30px;opacity: 0.65;' /></a>
	</td>
	<td style='text-align: left; width: calc(50% - 63px)'>
	<a href='https://www.instagram.com/coconutpudding.official' target='_blank'><img src='${baseUrlAPI}/v1/public/resources/img/sns-tw-gray.png' alt='twitter' style='width: 30px;opacity: 0.65;' /></a>
	</td>
    </tr>
	</table>
	</td></tr>

	<tr><td>
	<p style='text-align: center; color: #6b6b6b; margin: 0 auto; font-size: ${option.fontSize};'>© 2023 Coconut Pudding Indonesia.</p>
	<p style='text-align: center; color: #6b6b6b; margin: 0 auto; font-size: ${option.fontSize}; font-weight: 500;'>
	To stop receiving this notification email, 
	<span style='color: #930000;'>
	<a href='${baseUrlCMS}/login' style='color: #930000; text-decoration: none; font-weight: 500;'>My Page</a>
	</span> log in to My Page and follow the unsubscribe procedure.
	</p>
	<p style='text-align: center; color: #6b6b6b; margin: 0 auto; font-size: ${option.fontSize}; font-weight: 500;'>
	This e-mail is sent from a notification-only e-mail address, and even if you reply, you will not receive it.
	</p><br />
	</td></tr>
	</table>
	</td></tr>

	</table>
	</td></tr>
	</tbody>
	</table>

	</body>
	</html>`
}

export function templateEmailMailSend(body) {
	let footerInfo = { ...baseUrl }

	return `${getHeader(baseUrl, option)}
	
	${ /*<!-- MIDDLE SECTION -->*/''}
	<tr><td>
	<table border='0' cellspacing='0' cellpadding='0' style='width: 100%;line-height: 26px;font-size:${option.fontSize}'>
	<tr><td>

	${ /*<!-- MAIN CONTENT -- START -->*/''}
	${body}
	${ /*<!-- MAIN CONTENT -- END -->*/''}
	
	</td></tr>
	</table>
	</td></tr>

	${getFooter(footerInfo, option)}
	`
}