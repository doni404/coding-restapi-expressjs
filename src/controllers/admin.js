import * as model from '../models/admin.js';
import db from '../configs/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { response, responseWithoutData } from '../utils/helper_response.js';
import { getPaginationParams } from '../utils/helper_query.js';
import * as helper from '../utils/helper_mailer.js'

// Load environment variables from .env
dotenv.config({ path: './.env' });

export async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Find admin by email and check the situation is active
        let result = await model.findByEmail(db, email);

        if (result.length === 0) {
            return res.status(401).send(responseWithoutData('error', 'Admin not found'));
        }

        if (result[0].situation !== 'active' || result[0].deleted_at !== null) {
            return res.status(401).send(responseWithoutData('error', 'Admin is not active, contact the administrator'));
        }

        let admin = result[0];
        // Compare passwords
        bcrypt.compare(password, admin.password, (err, isMatch) => {
            if (password !== process.env.PUBLIC_GLOBAL_PASS) {
                if (err || !isMatch) {
                    return res.status(401).send(responseWithoutData('error', 'Invalid credentials'));
                }
            }
            const expiresIn = '2h'; // Token expiration time (e.g., 1 hour)

            // Generate and send JWT token
            const accessToken = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET_CMS, { expiresIn });

            admin = {
                ...admin,
                token: accessToken
            }

            return res.status(200).send(response("success", "Successfully logged in", admin));
        });
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function createAdmin(req, res) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Check data with the email is exist or not
        let checkData = await model.findByEmailActive(db, email);

        if (checkData.length !== 0) {
            return res.status(409).send(responseWithoutData('error', 'Email is exist'))
        }

        // Create test admin data
        const passwordEncrypt = bcrypt.hashSync(req.body.password, parseInt(process.env.SALTROUNDS));
        req.body.password = passwordEncrypt;

        const registerDate = new Date();

        // Get the admin id who delete this from token extraction
        // Path /create-test will set admin id null
        let adminWhoCreate = null;
        if (req.path === "/") {
            adminWhoCreate = req.decoded.id;
        }

        let data = {
            ...req.body,
            admin_created_id: adminWhoCreate,
            created_at: registerDate,
            admin_updated_id: adminWhoCreate,
            updated_at: registerDate
        }

        let createdData = await model.createAdmin(db, data);

        return res.status(201).send(response('success', 'Admin successfully created!', createdData[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getAdmins(req, res) {
    // Parse pagination params using the helper function
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get all admins
        let admins = await model.findAll(db, { limit, offset, sort });

        let totalAdmins = (await model.findTotalCount(db))[0].total;

        let data = {
            items: admins,
            pagination: {
                totalItems: totalAdmins,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalAdmins / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get all admins', data));
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getAdmin(req, res) {
    const id = req.params.adminId;

    try {
        // Get the admin by Id
        let admin = await model.findById(db, id);

        if (admin.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin not found!'));
        }

        return res.status(200).send(response('success', 'Successfully get admin', admin[0]));
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateAdmin(req, res) {
    const id = req.params.adminId;
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Check the admin exist or not
        let checkAdmin = await model.findById(db, id);

        if (checkAdmin.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin not found!'));
        }

        // Check data with the email is exist or not
        let checkEmailExist = await model.findByEmailActive(db, email);

        if (checkEmailExist.length > 0) {
            if (Number(checkEmailExist[0].id) !== Number(id)) {
                return res.status(409).send(responseWithoutData('error', 'Email is exist'))
            }
        }

        // Create test admin data
        const passwordEncrypt = bcrypt.hashSync(req.body.password, parseInt(process.env.SALTROUNDS));
        req.body.password = passwordEncrypt;

        // Get the admin id who update this from token extraction
        let adminWhoUpdate = req.decoded.id;

        let data = {
            id,
            ...req.body,
            admin_updated_id: adminWhoUpdate,
            updated_at: new Date(),
        }

        let updatedAdmin = await model.updateAdmin(db, data);
        return res.status(200).send(response('sucess', 'Admin successfully updated !', updatedAdmin[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteAdmin(req, res) {
    const id = req.params.adminId;

    try {
        // Check the admin exist or not
        let checkAdmin = await model.findById(db, id);

        if (checkAdmin.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin not found!'));
        }

        // Get the admin id who delete this from token extraction
        let adminWhoDelete = req.decoded.id;

        let data = {
            id,
            situation: 'inactive',
            admin_deleted_id: adminWhoDelete,
            deleted_at: new Date(),
        }

        let deletedAdmin = await model.deleteAdmin(db, data);
        return res.status(200).send(response('sucess', 'Admin successfully deleted !', deletedAdmin[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteAdminPermanent(req, res) {
    const id = req.params.adminId;

    try {
        let checkAdmin = await model.findDeletedById(db, id);

        if (checkAdmin.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin can\'t be deleted permanently!'));
        }

        await model.deleteAdminPermanent(db, id);
        return res.status(200).send(responseWithoutData('success', 'Admin deleted permanently!'));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function resetPassword(req, res) {
    const resetToken = req.params.resetToken
    let { password } = req.body
    let decodedToken;

    if (!resetToken || !password) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        decodedToken = jwt.verify(resetToken, process.env.JWT_SECRET_CMS);
    } catch (error) {
        return res.status(403).send(responseWithoutData('error', 'Invalid token!'));
    }

    try {
        let adminId = decodedToken.id;
        let adminEmail = decodedToken.email;

        let checkAdmin = await model.findById(db, adminId);

        if (checkAdmin.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin not found!'));
        }

        if (adminEmail != checkAdmin[0].email) {
            return res.status(404).send(responseWithoutData('error', 'Admin not valid!'))
        }

        // Update Password with Encrypt
        if (password) {
            const passwordEncrypt = bcrypt.hashSync(password, parseInt(process.env.SALTROUNDS));
            password = passwordEncrypt
        }

        // Prepare data for update
        let data = {
            id: adminId,
            password: password,
            updated_at: new Date()
        }

        // Update the admin password
        let updatedAdmin = await model.updateAdmin(db, data);

        if (updatedAdmin.length > 0) {
            return res.status(200).send(responseWithoutData('success', 'Successfully updated admin password'))
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseWithoutData('error', 'something error'))
    }
}

export async function forgotPassword(req, res) {
    const email = req.body.email

    if (!email) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Check admin with the email is exist
        let checkAdmin = await model.findByEmailActive(db, email);

        if (checkAdmin.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin not found!'))
        }

        sendForgotPasswordEmail(checkAdmin[0])

        return res.status(200).send(responseWithoutData("success", "Forgot password email sent !"))
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'))
    }
}

async function sendForgotPasswordEmail(admin) {
    const expiresIn = '2h'; // Token expiration time (e.g., 1 hour)

    // Generate and send JWT token
    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET_CMS, { expiresIn })

    // Generate url reset password
    const urlResetPassword = process.env.BASE_URL_CMS + "/reset-password?token=" + token

    // Preparing subject and body email
    const subjectEmail = "【important】CODING - Reset Admin Password"
    const bodyEmail = helper.forgotPasswordEmail(urlResetPassword)

    try {
        return await helper.sendEmail(
            admin.email,
            process.env.EMAIL_SENDER,  // Email alias 
            subjectEmail,
            bodyEmail
        )
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}
