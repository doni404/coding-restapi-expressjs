import { baseUrl, getHeader, getFooter, option } from "../helper_mailer.js"

export function forgotPassword(urlResetPassword) {
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