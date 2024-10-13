import db from '../configs/dbClient.js';
import * as model from '../models/admin_permission.js';
import { response, responseWithoutData } from '../utils/helper_response.js';

export async function getAllAdminPermissions(req, res) {
    let { query } = req;
    let queryParams = query;

    try {
        let result = await model.getAllAdminPermissions(db, queryParams);
        if (result.length === 0) {
            return res.send(response('success', 'Admin permission data is not found!', []));
        }

        return res.send(response('success', 'Successfully get all admin permissions', result));
    } catch (error) {
        console.log("🚀 ~ getAllAdminPermissions ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getAdminPermissionById(req, res) {
    let { params } = req;

    try {
        let id = params.id;

        let result = await model.getAdminPermissionById(db, id);
        if (result.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin permission data is not found!'));
        }

        return res.send(response('success', 'Get admin permission', result[0]));
    } catch (error) {
        console.log("🚀 ~ getAdminPermissionById ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function createAdminPermission(req, res) {
    let { body } = req;

    try {
        body = {
            ...body,
            created_at: new Date()
        };

        let result = await model.createAdminPermission(db, body);
        return res.status(201).send(response('success', 'Admin permission created', result[0]));
    } catch (error) {
        console.log("🚀 ~ createAdminPermission ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteAdminPermission(req, res) {
    let { params } = req;

    try {
        let result = await model.getAdminPermissionById(db, params.id);
        if (result.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin permission not found!'));
        }

        await model.deleteAdminPermission(db, params.id);
        return res.send(responseWithoutData('success', 'Admin permission permanently deleted!'));
    } catch (error) {
        console.log("🚀 ~ deleteAdminPermission ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}