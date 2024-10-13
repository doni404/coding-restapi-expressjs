
export function queryParamGenerator(params, prefix = '') {
    let customQuery = "";

    // Check if params is not null or undefined
    if (params) {
        // Check sort
        if (params.sort_by != null && params.sort_by.split(".").length == 2) {
            customQuery += "ORDER BY " + (prefix !== '' ? `${prefix}.` : '') + params.sort_by.split(".")[0] + " " + params.sort_by.split(".")[1].toUpperCase() + " ";
        }

        // Check limit
        if (params.limit != null) {
            customQuery += "LIMIT " + params.limit + " ";
        }

        // Check offset
        if (params.offset != null) {
            customQuery += "OFFSET " + params.offset + " ";
        }
    }

    return customQuery;
}

export function getDifferentData(oldData, newData) {
    let differences = {}

    for (let key in oldData) {
        if (key !== 'updated_at') {
            if (newData.hasOwnProperty(key) && oldData[key] !== newData[key]) {
                differences[key] = {
                    "old": oldData[key],
                    "new": newData[key]
                }
            }
        }
    }

    // Delete property which not have "new" or the "new" is undefined
    for (let key in differences) {
        if (!differences[key].hasOwnProperty('new') || differences[key].new === undefined) {
            delete differences[key]
        }
    }

    return differences
}

export function getUserRoleCreate(user, jsonObject) {
    if (user) {
        switch (user.type) {
            case 'cms':
                jsonObject = {
                    ...jsonObject,
                    admin_created_id: user.id,
                    admin_updated_id: user.id
                }
                break;
            case 'public':
                jsonObject = {
                    ...jsonObject,
                    admin_deleted_id: null,
                    admin_updated_id: null
                }
                break;
            case 't-cms':
                jsonObject = {
                    ...jsonObject,
                    admin_deleted_id: null,
                    admin_updated_id: null
                }
                break;
        }
    }
    return jsonObject
}

export function getUserRoleUpdate(user, jsonObject) {
    if (user) {
        switch (user.type) {
            case 'cms':
                jsonObject = {
                    ...jsonObject,
                    admin_updated_id: user.id
                }
                break;
            case 'public':
                jsonObject = {
                    ...jsonObject,
                    admin_updated_id: null
                }
                break;
            case 't-cms':
                jsonObject = {
                    ...jsonObject,
                    admin_updated_id: null
                }
                break;
        }
    }
    return jsonObject
}

export function getUserRoleDelete(user, jsonObject) {
    if (user) {
        switch (user.type) {
            case 'cms':
                jsonObject = {
                    ...jsonObject,
                    admin_deleted_id: user.id
                }
                break;
            case 'public':
                jsonObject = {
                    ...jsonObject,
                    admin_deleted_id: null
                }
                break;
            case 't-cms':
                jsonObject = {
                    ...jsonObject,
                    admin_deleted_id: null
                }
                break;
        }
    }
    return jsonObject
}
