import db from '../configs/dbClient.js'
import * as model from '../models/admin_login_log.js'
import * as helperString from '../utils/helper_string.js'
import { response, responseWithoutData } from '../utils/helper_response.js'
import { getClientUserAgent } from '../utils/helper_log.js'

export async function getAdminLoginLogsByAdminId(req, res) {
    let { params, query } = req

    try {
        let id = params.id

        let result = await model.getAdminLoginLogsByAdminId(db, id, query)
        if (result.length === 0) {
            return res.send(response('success', 'Admin login log is not found!', []))
        }
        return res.send(response('success', 'Get admin login logs by admin id', result))
    } catch (error) {
        console.log("🚀 ~ getAdminLoginLogsByAdminId ~ error:", error)
        return res.status(500).send(responseWithoutData('error', 'something error'))
    }
}

export async function createAdminLoginLog(req, res) {
    let { body } = req

    try {
        // Check body, should contains 'student_id'
        if (!helperString.containsRequiredKeys(body, ['admin_id'])) {
            return res.status(400).send(responseWithoutData('error', 'Bad Request: student_id is required'))
        }

        let additionalInfo = {}

        let clientUserAgent = await getClientUserAgent(req)
        if (clientUserAgent) {
            additionalInfo.ip_address = clientUserAgent.ip
            additionalInfo.browser = clientUserAgent.browser
            additionalInfo.os = clientUserAgent.os
            additionalInfo.platform = clientUserAgent.device === 'Other' ? 'pc' : 'mobile'
            additionalInfo.country = clientUserAgent.country
        }

        let data = {
            admin_id: body.admin_id,
            ...additionalInfo,
            created_at: new Date(),
        }

        let insertResult = await model.createAdminLoginLog(db, data)
        let result = await model.getAdminLoginLogsById(db, insertResult.insertId)
        return res.status(201).send(response('succes', 'Admin login log successfully created!', result[0]))
    } catch (error) {
        console.log("🚀 ~ createAdminLoginLog ~ error:", error)
        return res.status(500).send(responseWithoutData('error', 'something error'))
    }
}
