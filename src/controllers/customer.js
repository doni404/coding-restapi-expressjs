import * as model from '../models/customer.js';
import db from '../configs/dbClient.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { response, responseWithoutData } from '../utils/helper_response.js';
import { getPaginationParams } from '../utils/helper_query.js';
import * as mailerHelper from '../utils/helper_mailer.js';
import * as fileHelper from '../utils/helper_file.js';

// Load environment variables from .env
dotenv.config({ path: './.env' });

const UPLOAD_DIR = './uploads/customers/';

export async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Find customer by email and check the situation is active
        let checkCustomer = await model.findByEmail(db, email);

        if (checkCustomer.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer not found'));
        }

        if (checkCustomer[0].situation !== 'active' || checkCustomer[0].deleted_at !== null) {
            return res.status(401).send(responseWithoutData('error', 'Admin is not active, contact the administrator'));
        }

        let customer = checkCustomer[0];

        // Compare password
        bcrypt.compare(password, customer.password, (err, isMatch) => {
            if (password != process.env.PUBLIC_GLOBAL_PASS) {
                if (err || !isMatch) {
                    return res.status(401).send(responseWithoutData('error', 'Invalid credentials'));
                }
            }
            const expiresIn = '2h'; // Token expiration time (e.g., 1 hour) 

            // Generate and send JWT token
            const accessToken = jwt.sign({ id: customer.id, email: customer.email }, process.env.JWT_SECRET_CUSTOMER, { expiresIn });

            customer = {
                ...customer,
                token: accessToken
            }

            return res.status(200).send(response("success", "Successfully logged in", customer));
        });
    } catch(error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function createCustomer(req, res) {
    const { code, name, email, password } = req.body;

    if (!code || !name || !email || !password) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Check data with the email is exist or not
        let checkCustomer = await model.findByEmailActive(db, email);

        if (checkCustomer.length !== 0) {
            return res.status(409).send(responseWithoutData('error', 'Email is exist'))
        }

        // Encrypt the password
        const encryptedPassword = bcrypt.hashSync(password, parseInt(process.env.SALTROUNDS));
        req.body.password = encryptedPassword;

        // Upload the photo if the image attached
        if (req.body.photo) {
            let imagePath = await fileHelper.saveBase64ImageToPath(req.body.photo, UPLOAD_DIR);
            req.body.photo = imagePath;
        }

        // Get admin id who create this from token extraction
        let adminWhoCreate = req.decoded.id;

        let data = {
            ...req.body,
            admin_created_id: adminWhoCreate,
            created_at: new Date(),
            admin_updated_id: adminWhoCreate,
            updated_at: new Date()
        }

        let createdCustomer = await model.createCustomer(db, data);

        return res.status(201).send(response('success', 'Customer successfully created!', createdCustomer[0])); 
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getCustomers(req, res) {
    // Parse pagination params using the helper function
    const { limit, offset, sort } = getPaginationParams(req.query);

    try {
        // Get all customers
        let customers = await model.findAll(db, { limit, offset, sort });

        let totalCustomers = (await model.findTotalCount(db))[0].total;

        let data = {
            items: customers,
            pagination: {
                totalItems: totalCustomers,
                currentPage: Math.floor(offset / limit) + 1,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalCustomers / limit)
            }
        }

        return res.status(200).send(response('success', 'Successfully get all customers', data));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getCustomer(req, res) {
    const id = req.params.customerId;

    try {
        // Get the customer by id
        let customer = await model.findById(db, id);

        if (customer.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer not found!'));
        }

        return res.status(200).send(response('success', 'Successfully get customer', customer[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateCustomer(req, res) {
    const id = req.params.customerId;
    const { code, name, email, password } = req.body;

    if (!code || !name || !email || !password) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        // Check the customer exist or not
        let checkCustomer = await model.findById(db, id);

        if (checkCustomer.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer not found!'));
        }

        // Check customer with the email is exist or not
        let checkEmailExist = await model.findByEmailActive(db, email);

        if (checkEmailExist.length > 0) {
            if (Number(checkEmailExist[0].id) !== Number(id)) {
                return res.status(409).send(responseWithoutData('error', 'Email is exist'))
            }
        }

        // Generate the password
        const encryptedPassword = bcrypt.hashSync(password, parseInt(process.env.SALTROUNDS));
        req.body.password = encryptedPassword;

        // Check image need to update
        if (req.body.photo) {
            // If there's an existing photo, delete it
            if (checkCustomer[0].photo) {
                await fileHelper.deleteImage(checkCustomer[0].photo, UPLOAD_DIR);
            }

            // Upload the new photo
            let newImagePath = await fileHelper.saveBase64ImageToPath(req.body.photo, UPLOAD_DIR);
            req.body.photo = newImagePath;
        }

        // Get the admin id who update this from token extraction
        let adminWhoUpdate = req.decoded.id;

        let data = {
            id,
            ...req.body,
            admin_updated_id: adminWhoUpdate,
            updated_at: new Date()
        }

        let updatedCustomer = await model.updateCustomer(db, data);

        return res.status(200).send(response('sucess', 'Customer successfully updated !', updatedCustomer[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteCustomer(req, res) {
    const id = req.params.customerId;

    try {
        // Check the customer exist or not
        let checkCustomer = await model.findById(db, id);

        if (checkCustomer.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer not found!'));
        }

        // Get the admin id who delete this from token extraction
        let adminWhoDelete = req.decoded.id;

        let data = {
            id,
            situation: 'inactive',
            admin_deleted_id: adminWhoDelete,
            deleted_at: new Date(),
        }

        let deletedCustomer = await model.deleteCustomer(db, data);

        return res.status(200).send(response('sucess', 'Customer successfully deleted !', deleteCustomer[0]));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteCustomerPermanent(req, res) {
    const id = req.params.customerId;

    try {
        let checkCustomer = await model.findDeletedById(db, id);

        if (checkCustomer.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer not found!'));
        }

        // If there's an existing photo, delete it
        if (checkCustomer[0].photo) {
            await fileHelper.deleteImage(checkCustomer[0].photo, UPLOAD_DIR);
        }

        await model.deleteCustomerPermanent(db, id);

        return res.status(200).send(responseWithoutData('sucess', 'Customer permanently deleted !'));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function resetPassword(req, res) {
    const resetToken = req.params.resetToken;
    let { password } = req.body;
    let decodedToken;

    if (!resetToken || !password) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        decodedToken = jwt.verify(resetToken, process.env.JWT_SECRET_CUSTOMER);
    } catch (error) {
        return res.status(403).send(responseWithoutData('error', 'Invalid token!'));
    }

    try {
        let customerId = decodedToken.id;
        let customerEmail = decodedToken.email;

        let checkCustomer = await model.findById(db, customerId);

        if (checkCustomer.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer not found!'));
        }

        if (customerEmail != checkCustomer[0].email) {
            return res.status(404).send(responseWithoutData('error', 'Customer email not valid!'))
        }

        // Encrpy and update the password
        if (password) {
            const encryptedPassword = bcrypt.hashSync(password, parseInt(process.env.SALTROUNDS));
            password = encryptedPassword;
        }

        // Prepare data for update
        let data = {
            id: customerId,
            password: password,
            updated_at: new Date()
        }

        // Update the customer password
        let updatedCustomer = await model.updateCustomer(db, data)

        if (updatedCustomer.length > 0) {
            return res.status(200).send(responseWithoutData('success', 'Successfully updated customer password'))
        }
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function forgotPassword(req, res) {
    const email = req.body.email;

    if (!email) {
        return res.status(400).send(responseWithoutData('error', 'Invalid request body'));
    }

    try {
        let checkCustomer = await model.findByEmailActive(db, email);

        if (checkCustomer.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Customer not found!'));
        }

        sendForgotPasswordEmail(checkCustomer[0], res);
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

async function sendForgotPasswordEmail(customer, res) {
    const expiresIn = '2h'; // Token expiration time (e.g., 1 hour)

    // Generate and send JWT token
    const token = jwt.sign({ id: customer.id, email: customer.email }, process.env.JWT_SECRET_CUSTOMER, { expiresIn });

    // Generate url reset password
    const urlResetPassword = process.env.BASE_URL_CMS + "/reset-password?token=" + token;

    // Preparing subject and body email
    const subjectEmail = "【important】CODING - Reset Customer Password";
    const bodyEmail = mailerHelper.forgotPasswordEmail(urlResetPassword);

    try {
        await mailerHelper.sendEmail(
            customer.email,
            process.env.EMAIL_SENDER,  // Email alias 
            subjectEmail,
            bodyEmail
        );

        return res.status(200).send(responseWithoutData("success", "Forgot password email sent !"));
    } catch (error) {
        return res.status(500).send(responseWithoutData('error', 'something error when sending email'));
    }
}