import db from '../configs/dbClient.js';
import * as model from '../models/admin_role.js';
import * as modelAdminPermission from '../models/admin_permission.js';
import * as modelAdminRolePermission from '../models/admin_role_permission.js';
import * as helperString from '../utils/helper_string.js';
import { response, responseWithoutData } from '../utils/helper_response.js';

export async function getAllAdminRoles(req, res) {
    let { query } = req;

    try {
        let adminRoles = await model.getAllAdminRoles(db, query);
        if (adminRoles.length === 0) {
            return res.send(response('success', 'Admin roles data is not found!', []));
        }

        let results = [];
        for (let adminRole of adminRoles) {
            let adminPermissionList = await getAdminPermissionList(adminRole.id);
            adminRole = {
                ...adminRole,
                admin_permissions: adminPermissionList
            };
            results.push(adminRole);
        }

        return res.send(response('success', 'Successfully get admin roles', results));
    } catch (error) {
        console.log("🚀 ~ getAllAdminRoles ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function getAdminRoleById(req, res) {
    let { params } = req;

    try {
        let id = params.id;

        let result = await model.getAdminRoleById(db, id);
        console.log("🚀 ~ getAdminRoleById ~ result:", result);
        if (result.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin role is not found!'));
        }

        result = result[0];
        let adminPermissionList = await getAdminPermissionList(id);
        result = {
            ...result,
            admin_permissions: adminPermissionList
        };
        return res.send(response('success', 'Successfully admin role by id', result));
    } catch (error) {
        console.log("🚀 ~ getAdminRoleById ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function createAdminRole(req, res) {
    let { body } = req;

    try {
        let adminRoleData = body;

        // Check the body, contains 'name', 'admin_permissions' keys
        if (!helperString.containsRequiredKeys(adminRoleData, ['name', 'admin_permissions'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: name, admin_permissions are required'));
        }

        let adminPermissions;
        if (adminRoleData.admin_permissions) {
            adminPermissions = adminRoleData.admin_permissions;
            delete adminRoleData.admin_permissions;
        }

        adminRoleData = {
            ...adminRoleData,
            created_at: new Date(),
            updated_at: new Date()
        };

        let result = await model.createAdminRole(db, adminRoleData);
        result = result[0];

        let admin_permissions = [];
        // add permission
        if (adminPermissions) {
            const createdDate = new Date();

            for (let permissionId of adminPermissions) {
                // Check permission available?
                let checkAdminPermissionData = await modelAdminPermission.getAdminPermissionById(db, permissionId);
                if (checkAdminPermissionData.length !== 0) {
                    // Check role permission is already exist?
                    let checkAdminRolePermissionData = await modelAdminRolePermission.checkAdminRolePermissionExist(db, { roleId: result.id, permissionId: permissionId });
                    if (checkAdminRolePermissionData.length === 0) {
                        let rolePermissionData = {
                            admin_role_id: result.id,
                            admin_permission_id: permissionId,
                            created_at: createdDate
                        };

                        let resultRolePermission = await modelAdminRolePermission.createAdminRolePermission(db, rolePermissionData);
                        if (resultRolePermission.length !== 0) {
                            admin_permissions.push(resultRolePermission);
                        }
                    }
                }
            }
        }

        // attach admin permission to response
        result = {
            ...result,
            admin_permissions: admin_permissions
        };

        return res.status(201).send(response('success', 'Admin role created!', result));
    } catch (error) {
        console.log("🚀 ~ createAdminRole ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function updateAdminRole(req, res) {
    let { body, params } = req;

    try {
        let id = params.id;
        let adminRoleData = body;

        // Check the body, contains 'name', 'admin_permissions' keys
        if (!helperString.containsRequiredKeys(adminRoleData, ['name', 'admin_permissions'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: name, admin_permissions are required'));
        }

        let adminPermissionsUpdate;
        if (adminRoleData.admin_permissions) {
            adminPermissionsUpdate = adminRoleData.admin_permissions;
            delete adminRoleData.admin_permissions;
        }

        let currentAdminPermissions = await modelAdminRolePermission.getPermissionIdListByRoleId(db, id);
        let currentAdminPermissionIdArr = currentAdminPermissions.map(item => item.admin_permission_id);

        const deletedAdminPermission = currentAdminPermissionIdArr.filter(item => !adminPermissionsUpdate.includes(item));
        const updatedAdminPermission = adminPermissionsUpdate.filter(item => !currentAdminPermissionIdArr.includes(item));
        // console.log('Delete Admin Permission : ', deletedAdminPermission);
        // console.log('Update admin permission : ', updatedAdminPermission);

        adminRoleData = {
            id: id,
            ...adminRoleData,
            updated_at: new Date()
        };

        let currentData = await model.getAdminRoleById(db, id);
        if (currentData.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin role not found!'));
        }

        let updatedAdminRole = await model.updateAdminRole(db, adminRoleData);

        // Update Role Permission
        if (deletedAdminPermission.length !== 0) {
            for (let permissionId of deletedAdminPermission) {
                // Check role permission is already exist?
                let checkAdminRolePermissionData = await modelAdminRolePermission.checkAdminRolePermissionExist(db, { roleId: id, permissionId: permissionId });
                if (checkAdminRolePermissionData.length !== 0) {
                    await modelAdminRolePermission.deleteAdminRolePermissionByRolePermission(db, { roleId: id, permissionId: permissionId });
                }
            }
        }
        if (updatedAdminPermission.length !== 0) {
            let createdDate = new Date();
            for (let permissionId of updatedAdminPermission) {
                // Check permission available?
                let checkAdminPermissionData = await modelAdminPermission.getAdminPermissionById(db, permissionId);
                if (checkAdminPermissionData.length !== 0) {
                    // Check role permission is already exist?
                    let checkAdminRolePermissionData = await modelAdminRolePermission.checkAdminRolePermissionExist(db, { roleId: id, permissionId: permissionId });
                    if (checkAdminRolePermissionData.length === 0) {
                        let rolePermissionData = {
                            admin_role_id: id,
                            admin_permission_id: permissionId,
                            created_at: createdDate
                        };

                        await modelAdminRolePermission.createAdminRolePermission(db, rolePermissionData);
                    }
                }
            }
        }

        updatedAdminRole = updatedAdminRole[0];
        let adminRolePermissions = await modelAdminRolePermission.getAdminRolePermissionByRoleId(db, id);
        updatedAdminRole = {
            ...updatedAdminRole,
            admin_permissions: adminRolePermissions
        };

        return res.send(response('success', 'Admin role updated', updatedAdminRole));
    } catch (error) {
        console.log("🚀 ~ updateAdminRole ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteAdminRole(req, res) {
    let { params } = req;

    try {
        let id = params.id;
        let data = {
            id: id,
            deleted_at: new Date()
        };

        let currentData = await model.getAdminRoleById(db, id);
        if (currentData.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin role not found!'));
        }

        let result = await model.deleteAdminRole(db, data);
        return res.send(response('success', 'Admin role successfully deleted!', result[0]));
    } catch (error) {
        console.log("🚀 ~ deleteAdminRole ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

export async function deleteAdminRolePermanently(req, res) {
    let { params } = req;

    try {
        let id = params.id;

        let dataDeleted = await model.getAdminRoleDeleted(db, id);
        if (dataDeleted.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Admin can\'t be deleted permanently!'));
        }

        await model.deleteAdminRolePermanently(db, id);
        return res.send(responseWithoutData('success', 'Admin role successfull deleted permanently!'));
    } catch (error) {
        console.log("🚀 ~ deleteAdminRolePermanently ~ error:", error);
        return res.status(500).send(responseWithoutData('error', 'something error'));
    }
}

async function getAdminPermissionList(adminRoleId) {
    let adminRolePermissions = await modelAdminRolePermission.getAdminRolePermissionByRoleId(db, adminRoleId);
    let adminPermissionList = [];
    if (adminRolePermissions.length !== 0) {
        for (let adminRolePermission of adminRolePermissions) {
            let adminPermission = await modelAdminPermission.getAdminPermissionById(db, adminRolePermission.admin_permission_id);
            if (adminPermission.length !== 0) {
                adminPermissionList.push(adminPermission[0]);
            }
        }
    }

    return adminPermissionList;
}