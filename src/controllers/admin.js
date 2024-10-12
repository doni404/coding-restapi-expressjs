import db from '../configs/dbClient.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import * as model from '../models/admin.js';
import * as modelAdminRole from '../models/admin_role.js';
import * as modelAdminRolePermission from '../models/admin_role_permission.js';
import * as modelAdminPermission from '../models/admin_permission.js';
import * as modelMailTemplate from '../models/mail_template.js';
import * as helperMailer from '../utils/helper_mailer.js';
import * as helperString from '../utils/helper_string.js';
import * as helperModel from '../utils/helper_model.js';
import { response, responseWithoutData } from '../utils/helper_response.js';

// Load environment variables from .env
dotenv.config({ path: './.env' });

export async function login(req, res) {
    let { body } = req;

    try {
        let data = body;

        // Check the body, only contains 'email', 'password', and 'remember'
        if (!helperString.hasAllowedKeysOnly(data, ['email', 'password', 'remember'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: only allow email, password and remember'));
        }
        // Check the body required 
        if (!helperString.containsRequiredKeys(data, ['email', 'password'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: email and password are required'));
        }

        // Find admin by email and check the situation is active
        let result = await model.getAdminByEmail(db, data.email);
        if (result.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Email not found'));
        }

        if (result[0].situation !== 'active' || result[0].deleted_at !== null) {
            return res.status(401).send(responseWithoutData('error', 'Admin is not active, contact the administrator'));
        }

        // Get the admin data
        let admin = result[0];

        // Compare passwords
        bcrypt.compare(data.password, admin.password, async (err, isMatch) => {
            if (data.password !== process.env.PUBLIC_GLOBAL_PASS) {
                if (err || !isMatch) {
                    return res.status(401).send(responseWithoutData('error', 'Invalid password'));
                }
            }

            let expiresIn = '7d'; // Token expiration time (e.g., 1 hour)
            if (body.remember) {
                expiresIn = '30d';
            }

            // Generate and send JWT token
            const accessToken = jwt.sign({ id: admin.id, email: admin.email, type: 'cms' }, process.env.JWT_SECRET_CMS, { expiresIn });

            if (admin.admin_role_id) {
                let adminRole = await getAdminRolePermissionList(admin);
                delete admin.admin_role_id;
                admin = {
                    ...admin,
                    admin_role: adminRole
                }
            }

            admin = {
                ...admin,
                token: accessToken
            };

            return res.status(200).send(response("success", "Successfully logged in", admin));
        });
    } catch (error) {
        console.log("🚀 ~ login ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function forgotPassword(req, res) {
    let { body } = req

    try {
        let data = body;

        // Check the body, only contains 'email'
        if (!helperString.hasAllowedKeysOnly(data, ['email'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: only allow email'));
        }
        // Check the body required 
        if (!helperString.containsRequiredKeys(data, ['email'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: email is required'));
        }

        // Check admin with the email is exist
        let result = await model.getAdminByEmailActive(db, data.email);
        if (result.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin not found!'));
        }

        let admin = result[0];
        
        // Send the forgot password email
        const emailResult = await sendForgotPasswordEmail(admin);

        // Handle the result of email sending
        if (emailResult.success) {
            return res.status(200).send(responseWithoutData("success", "Email forgot password sent to " + admin.email));
        } else {
            console.log("🚀 ~ forgotPassword ~ smtp error:", emailResult.error);
            return res.status(500).send(responseWithoutData('error', 'something error'));
        }
    } catch (error) {
        console.log("🚀 ~ forgotPassword ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'))
    }
}

export async function resetPassword(req, res) {
    let { body, params } = req;

    try {
        let data = body;

        // Check the body, only contains 'password'
        if (!helperString.hasAllowedKeysOnly(data, ['password'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: only allow password'));
        }
        // Check the body required 
        if (!helperString.containsRequiredKeys(data, ['password'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: password is required'));
        }

        let resetPassToken = params.resetPassToken;
        jwt.verify(resetPassToken, process.env.JWT_SECRET_CMS, async (err, decoded) => {
            if (err) {
                // Check if the error is due to token expiration
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).send(responseWithoutData('error', 'The password reset link has expired. Please request a new password reset.'));
                } else {
                    // For any other error, consider the token as invalid
                    return res.status(401).send(responseWithoutData('error', 'The password reset link is invalid or has already been used. Please request a new password reset.'));
                }
            }

            // Token is valid
            let adminId = decoded.id
            let adminEmail = decoded.email

            // Check if admin exists by ID
            let result = await model.getAdminById(db, adminId)
            if (result.length === 0) {
                return res.status(404).send(responseWithoutData('error', 'Admin not found!'))
            }

            // Ensure the email matches
            if (adminEmail != result[0].email) {
                return res.status(403).send(responseWithoutData('error', 'You do not have permission to reset the password with the provided token.'))
            }

            // Encrypt the new password
            const passwordEncrypt = bcrypt.hashSync(data.password, parseInt(process.env.SALTROUNDS))
            data.password = passwordEncrypt

            // Prepare data for update
            data = {
                id: adminId,
                ...data,
                updated_at: new Date()
            }

            // Update admin password
            let updatedAdmin = await model.updateAdmin(db, data)
            return res.send(responseWithoutData('success', 'Successfully reset admin password'))
        });
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function verifyAdminTokenAuth(req, res) {
    let { body, params } = req;

    try {
        let data = body;

        // Check the body, only contains 'password'
        if (!helperString.hasAllowedKeysOnly(data, ['token'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: only allow token'));
        }
        // Check the body required 
        if (!helperString.containsRequiredKeys(data, ['token'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: token is required'));
        }

        let tokenAuth = body.token;
        jwt.verify(tokenAuth, process.env.JWT_SECRET_CMS, async (err, decoded) => {
            if (err) {
                // Check if the error is due to token expiration
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).send(responseWithoutData('error', 'The password reset link has expired. Please request a new password reset.'));
                } else {
                    // For any other error, consider the token as invalid
                    return res.status(401).send(responseWithoutData('error', 'The password reset link is invalid or has already been used. Please request a new password reset.'));
                }
            }

            // Convert Unix timestamp to date if needed
            let issued_date = "";
            let expirate_date = "";
            if (decoded.exp) {
                expirate_date = dayjs.unix(decoded.exp).format('YYYY-MM-DD HH:mm:ss');
                // console.log("Converted Date:", expirate_date)
            }
            if (decoded.iat) {
                issued_date = dayjs.unix(decoded.iat).format('YYYY-MM-DD HH:mm:ss');
                // console.log("Converted Date:", issued_date)
            }

            let result = { token_status: "valid", token_expiry: expirate_date };
            return res.send(response('success', 'Token auth successfully verified', result));
        });
    } catch (error) {
        console.log("🚀 ~ verifyAdminTokenAuth ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getAllAdmins(req, res) {
    try {
        // Get all admins
        let result = await model.getAllAdmins(db, req.query);
        if (result.length === 0) {
            return res.send(response('success', 'Admin data is not found!', []));
        }

        let responses = [];
        for (let admin of result) {
            if (admin.admin_role_id) {
                let adminRole = await getAdminRolePermissionList(admin);
                delete admin.admin_role_id;
                admin = {
                    ...admin,
                    admin_role: adminRole
                };
            }

            responses.push(admin);
        }

        return res.status(200).send(response('success', 'Successfully get all admins', responses));
    } catch (error) {
        console.log("🚀 ~ getAllAdmins ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getAdminById(req, res) {
    let { params } = req;

    try {
        let id = params.id;

        // Get the admin by Id
        let result = await model.getAdminById(db, id);
        if (result.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin is not found!'));
        }

        result = result[0]
        if (result.admin_role_id) {
            let adminRole = await getAdminRolePermissionList(result)
            delete result.admin_role_id
            result = {
                ...result,
                admin_role: adminRole
            }
        }

        return res.status(200).send(response('success', 'Successfully get admin', result));
    } catch (error) {
        console.log("🚀 ~ getAdminById ~ error:", error)
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function createAdmin(req, res) {
    let { body } = req;

    try {
        let adminData = body;

        // Check the body, contains 'email', 'name', 'password'
        if (!helperString.containsRequiredKeys(adminData, ['email', 'password', 'name'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: email, password, name are required'));
        }

        // Checking the Body, is it have a Json params with empty string value? 
        const propsToCheck = ['email', 'name', 'password'];
        if (helperString.containsEmptyStringForSpecificProps(propsToCheck, adminData)) {
            return res.status(400).send(responseWithoutData('error', 'Body can\'t be empty'));
        }

        // Check admin_role_id if exist
        if (adminData.admin_role_id) {
            let adminRole = await modelAdminRole.getAdminRoleById(db, adminData.admin_role_id);
            if (adminRole.length === 0) {
                return res.status(404).send(responseWithoutData('error', 'Admin role is not found!'));
            }
        }

        // Get the email
        let email = adminData.email;

        // Check password if exist
        if (adminData.password) {
            const passwordEncrypt = bcrypt.hashSync(adminData.password, parseInt(process.env.SALTROUNDS));
            adminData.password = passwordEncrypt;
        }

        // Prepare data for insert
        let data = {
            ...adminData,
            created_at: new Date(),
            updated_at: new Date()
        }

        console.log("🚀 ~ createAdmin ~ data:", data);

        data = helperModel.getUserRoleCreate(req.user, data)

        console.log("🚀 ~ createAdmin ~ data after :", data);
        console.log("🚀 ~ createAdmin ~ req.user :", req.user);

        // Check if email is already taken
        let currentData = await model.getAdminByEmailActive(db, email);
        if (currentData.length !== 0) {
            return res.status(409).send(responseWithoutData('error', 'Email is already taken'));
        }

        // Create the admin data and return the result
        let result = await model.createAdmin(db, data);

        return res.status(201).send(response('success', 'Admin successfully created!', result[0]));
    } catch (error) {
        console.log("🚀 ~ createAdmin ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateAdmin(req, res) {
    let { body, params } = req;

    try {
        // Prepare data for update
        let id = params.id;

        let data = {
            id: id,
            ...body,
            updated_at: new Date()
        }

        data = helperModel.getUserRoleUpdate(req.user, data)

        // Checking the Body, is it have a Json params with empty string value?
        const propsToCheck = ['email', 'name'];
        if (helperString.containsEmptyStringForSpecificProps(propsToCheck, data)) {
            return res.status(400).send(responseWithoutData('error', 'Body can\'t be empty'));
        }

        // Check admin_role_id if exist
        if (data.admin_role_id) {
            let adminRole = await modelAdminRole.getAdminRoleById(db, data.admin_role_id);
            if (adminRole.length === 0) {
                return res.status(404).send(responseWithoutData('error', 'Admin Role not found!'));
            }
        }

        // Check password if exist
        if (data.password) {
            const passwordEncrypt = bcrypt.hashSync(data.password, parseInt(process.env.SALTROUNDS));
            data.password = passwordEncrypt;
        }

        // Get current data
        let currentData = await model.getAdminById(db, id);
        if (currentData.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin not found!'));
        } else {
            currentData = currentData[0];
        }

        // Check if email is changed
        if (currentData.email !== data.email) {
            let checkEmailAvailability = await model.getEmailAvailability(db, { email: data.email, id: currentData.id });
            if (checkEmailAvailability.length !== 0) {
                return res.status(409).send(responseWithoutData('error', 'Email is already taken'));
            }
        }

        // Update the data
        let result = await model.updateAdmin(db, data);
        return res.send(response('success', 'Admin successfully updated!', result[0]));
    } catch (error) {

        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updatePassword(req, res) {
    let { body, params } = req;

    try {
        let data = body;

        // Check the body, only contains 'password'
        if (!helperString.hasAllowedKeysOnly(data, ['password'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: only allow password'));
        }
        // Check the body required
        if (!helperString.containsRequiredKeys(data, ['password'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: password is required'));
        }

        // Check admin with the id is exist
        let id = params.id;
        let result = await model.getAdminById(db, id);
        if (result.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin not found!'));
        }

        // Update Password with Encrypt
        const passwordEncrypt = bcrypt.hashSync(data.password, parseInt(process.env.SALTROUNDS));
        data.password = passwordEncrypt;

        // Prepare data for update
        data = {
            id,
            ...data,
            updated_at: new Date()
        }

        await model.updateAdmin(db, data);
        result = await model.getAdminById(db, id);
        return res.send(response('success', 'Successfully updated admin password', result[0]));
    } catch (error) {
        console.log("🚀 ~ updatePassword ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteAdmin(req, res) {
    let { params } = req;

    try {
        let id = params.id;

        // Check the admin exist or not
        let result = await model.getAdminById(db, id)
        if (result.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin not found!'))
        }

        let data = {
            id,
            deleted_at: new Date(),
        }

        data = helperModel.getUserRoleDelete(req.user, data)

        let deletedAdmin = await model.deleteAdmin(db, data);
        return res.status(200).send(response('success', 'Admin successfully deleted !', deletedAdmin[0]));
    } catch (error) {
        console.log("🚀 ~ deleteAdmin ~ error:", error)
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteAdminPermanent(req, res) {
    let { params } = req;

    try {
        let id = params.id

        let dataDeleted = await model.getAdminDeletedById(db, id);
        if (dataDeleted.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin can\'t be deleted permanently!'));
        }

        await model.deleteAdminPermanent(db, id);
        return res.status(200).send(responseWithoutData('success', 'Admin permanently deleted!'));
    } catch (error) {
        console.log("🚀 ~ deleteAdminPermanently ~ error:", error)
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

async function sendForgotPasswordEmail(admin) {
    try {
        // Generate and send JWT token
        const expiresIn = '1h'; // Token expiration time (e.g., 1 hour)
        const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET_CMS, { expiresIn });

        // Generate url reset password
        const resetPasswordUrl = process.env.BASE_URL_CMS + `/reset-password/${token}`

        // Preparing subject and body email
        let subjectEmail = ''
        let bodyEmail = ''
        let bodyContent = ''
        let style = "background:#122b4f;text-decoration:none !important; font-weight:500; margin-top:10px; margin-bottom:10px; color:#fff;text-transform:uppercase; font-size:13px;padding:10px 18px;display:inline-block;"
        let buttonResetPassword = `<a href='${resetPasswordUrl}' style='${style}'>Ubah kata sandi</a>`

        // Get mail template
        let mailTemplateResult = await modelMailTemplate.getMailTemplateBySlug(db, 'forgot_to_admin')
        if (mailTemplateResult.length !== 0) {
            mailTemplateResult = mailTemplateResult[0]

            subjectEmail = mailTemplateResult.subject.replace(/\"/g, '')
            bodyContent = mailTemplateResult.body

            // Replace variable with dynamic value
            bodyContent = bodyContent.replace(/\[ADMIN_NAME\]/g, helperString.textToFullWidth(admin.name))
            bodyContent = bodyContent.replace(/\[RESET_PASSWORD_URL\]/g, buttonResetPassword)
            bodyContent = bodyContent.split('\n').join('<br>')

            bodyEmail = helperMailer.templateEmailMailSend(bodyContent)
        } else {
            subjectEmail = "[Important] Coding Administrator Password Reset URL Notification"
            bodyEmail = helperMailer.admin.forgotPassword({ adminName: admin.name, resetPasswordUrl: resetPasswordUrl })
        }

        // Send email
        const sendEmailResult = await helperMailer.sendEmail(admin.email, subjectEmail, bodyEmail);
        return sendEmailResult;
    } catch (error) {
        throw new Error(`Error sending forgot password email: ${error.message}`);
    }
}

async function getAdminRolePermissionList(admin) {
    let adminRole = await modelAdminRole.getAdminRoleById(db, admin.admin_role_id)
    if (adminRole.length !== 0) {
        adminRole = adminRole[0]

        let adminRolePermissions = await modelAdminRolePermission.getAdminRolePermissionByRoleId(db, adminRole.id)
        let adminPermissionList = []
        if (adminRolePermissions.length !== 0) {
            for (let adminRolePermission of adminRolePermissions) {
                let adminPermission = await modelAdminPermission.getAdminPermissionById(db, adminRolePermission.admin_permission_id)
                if (adminPermission.length !== 0) {
                    adminPermissionList.push(adminPermission[0])
                }
            }
        }

        adminRole = {
            ...adminRole,
            admin_permissions: adminPermissionList
        }
    }

    return adminRole
}