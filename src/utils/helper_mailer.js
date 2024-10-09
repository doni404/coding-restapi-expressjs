import dotenv from 'dotenv'
import { transporterSMTP } from '../configs/smtpClient.js';

// Load environment variables from .env
dotenv.config({ path: './.env' });

export async function sendEmail(toAddress, fromAddress, subject, body) {
    const mailData = {
        from: fromAddress,  // sender address
        to: toAddress,   // list of receivers (but for now it owner email to get notice)
        subject: subject,
        html: body,
    };

    try {
        transporterSMTP.sendMail(mailData, function (error, info) {
            if (error) {
                return res.status(500).send(responseWithoutData('error', 'Error with SMTP credentials'));
            } else {
                return res.status(200).send(responseWithoutData('success', 'Forgot password mail sent!'));
            }
        });
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'Error while trying to send email'));
    }
};

function getHeader() {
    const baseURLEC = process.env.BASE_URL_PUBLIC;
    const baseURLCMS = process.env.BASE_URL_CMS;
    const baseURLAPI = process.env.BASE_URL_API;

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
	<img src='${baseURLAPI}/v1/public/resources/img/logo.png' style='width: 100%; max-width: 280px;' />
	</div><br />
	<hr style='border-style: solid; border-width: 1px; border-color: #c0c0c0;width: 100%;' /><br />
	</td></tr>
	</table>
	</td></tr>`
}

function getFooter() {
    const baseURLEC = process.env.BASE_URL_PUBLIC;
    const baseURLCMS = process.env.BASE_URL_CMS;
    const baseURLAPI = process.env.BASE_URL_API;

    return `${ /* <!-- BOTTOM SECTION --> */''}
	<tr><td>
	<table border='0' cellspacing='0' cellpadding='0' style='width: 100%;line-height: 22px;'>
	<br /><hr style='border-style: solid; border-width: 1px; border-color: #c0c0c0;width: 100%;' /><br />
	</td></tr>

	<tr><td>
	<div style='text-align: center; font-size: 13px;'>
	<a href='${baseURLEC}/terms' style='color: #960000; text-decoration: none; font-weight: 500;'>Terms</a>
	<span style='color: #6b6b6b; margin: 0 10px;font-size: 18px;vertical-align: middle;'>&#8226;</span>
	<a href='${baseURLEC}/privacy-policy' style='color: #960000; text-decoration: none; font-weight: 500;'>Privacy Policy</a>
	<span style='color: #6b6b6b; margin: 0 10px;font-size: 18px;vertical-align: middle;'>&#8226;</span>
	<a href='${baseURLEC}/contact' style='color: #960000; text-decoration: none; font-weight: 500;'>Inquiry</a>
	</div>
	</td></tr>

	<tr><td>
	<table border='0' cellspacing='0' cellpadding='0' style='margin: 16px auto 12px; text-align: center; width: 100%'
	<tr>
	<td style='text-align: right; width: calc(50% - 63px)'>
	<a href='https://www.instagram.com/coconutpudding.official' target='_blank'><img src='${baseURLAPI}/v1/public/resources/img/sns-fb-gray.png' alt='facebook' style='width: 30px;opacity: 0.65;' /></a>
	</td> 
	<td style='text-align: center; width: 63px'>
	<a href='https://www.instagram.com/coconutpudding.official' target='_blank'><img src='${baseURLAPI}/v1/public/resources/img/sns-ig-gray.png' alt='instagram' style='width: 30px;opacity: 0.65;' /></a>
	</td>
	<td style='text-align: left; width: calc(50% - 63px)'>
	<a href='https://www.instagram.com/coconutpudding.official' target='_blank'><img src='${baseURLAPI}/v1/public/resources/img/sns-tw-gray.png' alt='twitter' style='width: 30px;opacity: 0.65;' /></a>
	</td>
    </tr>
	</table>
	</td></tr>

	<tr><td>
	<p style='text-align: center; color: #6b6b6b; margin: 0 auto; font-size: 13px;'>© 2023 Coconut Pudding Indonesia.</p>
	<p style='text-align: center; color: #6b6b6b; margin: 0 auto; font-size: 13px; font-weight: 500;'>
	To stop receiving this notification email, 
	<span style='color: #930000;'>
	<a href='${baseURLCMS}/login' style='color: #930000; text-decoration: none; font-weight: 500;'>My Page</a>
	</span> log in to My Page and follow the unsubscribe procedure.
	</p>
	<p style='text-align: center; color: #6b6b6b; margin: 0 auto; font-size: 13px; font-weight: 500;'>
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

export function forgotPasswordEmail(urlResetPassword) {
    let style = "background:#0a50e2;text-decoration:none !important; font-weight:500; margin-top:10px; color:#fff;text-transform:uppercase; font-size:13px;padding:10px 24px;display:inline-block;border-radius:50px;"

    return `${getHeader()}
	
	${ /*<!-- MIDDLE SECTION -->*/''}
	<tr><td>
	<table border='0' cellspacing='0' cellpadding='0' style='width: 100%;line-height: 26px;font-size:14px'>
	<tr><td>

	${ /*<!-- MAIN CONTENT -- START -->*/''}
	<p>We received a password reset request. Click the button below to change your password.</p>
	<a href='${urlResetPassword}' style='${style}'>Reset Password</a>
	<p>If clicking the "Reset Password" button does not work, please copy the URL below and paste it into your browser.</p>
	<a href='${urlResetPassword}'>${urlResetPassword}</a><br /><br />
	<p>If you do not recognize this email, please discard this email.</p>
	${ /*<!-- MAIN CONTENT -- END -->*/''}
	
	</td></tr>
	</table>
	</td></tr>

	${getFooter()}
	`
}