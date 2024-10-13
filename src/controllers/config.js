import db from '../configs/dbClient.js'
import * as model from '../models/config.js'
import * as helperModel from '../utils/helper_model.js'
import { response, responseWithoutData } from '../utils/helper_response.js'

export async function getAllConfigs(req, res) {
    try {
        let configs = await model.getAllConfigs(db)
        if (configs.length === 0) {
            return res.send(responseWithoutData('error', 'Configs data not found'))
        }

        return res.send(response('success', 'Showing all configs', configs))
    } catch (error) {
        console.log("🚀 ~ getAllConfigs ~ error:", error)
        return res.status(500).send(responseWithoutData('error', 'something error'))
    }
}

export async function getConfigById(req, res) {
    let { params } = req
    try {
        let id = params.id

        let config = await model.getConfigById(db, id)
        if (config.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Config data not found'))
        }

        return res.send(response('success', 'Showing config by id', config[0]))
    } catch (error) {
        console.log("🚀 ~ getConfigById ~ error:", error)
        return res.status(500).send(responseWithoutData('error', 'something error'))
    }
}

export async function updateConfig(req, res) {
    let { body, params } = req
    try {
        let id = params.id

        // Prepare data for update
        let dataUpdate = {
            id: id,
            ...body,
            updated_at: new Date()
        }
        dataUpdate = helperModel.getUserRoleUpdate(req.user, dataUpdate)

        // Check data is exists
        let currentData = await model.getConfigById(db, id)
        if (currentData.length === 0) {
            return res.status(404).send(responseWithoutData('error', 'Config data not found'))
        }

        await model.updateConfig(db, dataUpdate)
        let result = await model.getConfigById(db, id)
        result = result[0]

        return res.send(response('success', 'Config successfully updated', result))
    } catch (error) {
        console.log("🚀 ~ updateConfig ~ error:", error)
        return res.status(500).send(responseWithoutData('error', 'something error'))
    }
}

export async function getEmailAdmin() {
    try {
        let emailAdmin = process.env.EMAIL_ADMIN
        let configs = await model.getAllConfigs(db)
        if (configs.length > 0) {
            emailAdmin = configs[0].admin_email
        }
        return emailAdmin
    } catch (error) {
        console.log("🚀 ~ getEmailAdmin ~ error:", error)
        throw error
    }
}

export async function getEmailSender() {
    try {
        let emailSender = process.env.SMTP_EMAIL_SENDER
        let configs = await model.getAllConfigs(db)
        if (configs.length > 0) {
            emailSender = `${configs[0].sender_name} <${configs[0].sender_email}>`
            console.log("🚀 ~ getEmailSender ~ emailSender:", emailSender)
        }
        return emailSender
    } catch (error) {
        console.log("🚀 ~ getEmailSender ~ error:", error)
        throw error
    }
}