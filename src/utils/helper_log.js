import useragent from "useragent"
import geoip from "geoip-lite"
import countries from "i18n-iso-countries"

/**
 * Parses the user agent and returns the parsed details.
 * @param {string} userAgentString - The user agent string from the request headers.
 * @returns {object} - An object containing parsed browser, OS, and device details.
 */
export function parseUserAgent(userAgentString) {
    const agent = useragent.parse(userAgentString)

    return {
        browser: {
            name: agent.family,
            version: `${agent.major}.${agent.minor}.${agent.patch}`
        },
        os: {
            name: agent.os.family,
            version: `${agent.os.major}.${agent.os.minor}.${agent.os.patch}`
        },
        device: {
            name: agent.device.family
        },
        source: agent.source
    }
}

/**
 * Logs the client information.
 * @param {object} req - The Express request object.
 */
export async function getClientUserAgent(req) {
    try {
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
        const geo = geoip.lookup(ip)
        const countryCode = geo ? geo.country.toUpperCase() : '' // Ensure the code is in uppercase
        const countryName = countryCode ? countries.getName(countryCode, 'en') : '' // Change 'en' to 'id' for Indonesian

        const userAgentString = req.headers['user-agent']
        const clientInfo = parseUserAgent(userAgentString)

        // Log the client information
        // console.log(`Client connected from IP: ${ip}`)
        // console.log(`Browser: ${clientInfo.browser.name}, Version: ${clientInfo.browser.version}`)
        // console.log(`OS: ${clientInfo.os.name}, Version: ${clientInfo.os.version}`)
        // console.log(`Device: ${clientInfo.device.name}`)
        // console.log("User cookie: ", (req.cookies ? req.cookies : 'No cookie'))
        // console.log("🚀 ~ getClientUserAgent ~ geo:", geo)
        // console.log("🚀 ~ getClientUserAgent ~ countryName:", countryName)

        return {
            ip: ip,
            browser: clientInfo.browser.name + " " + clientInfo.browser.version,
            os: clientInfo.os.name + " " + clientInfo.os.version,
            device: clientInfo.device.name,
            source: clientInfo.source,
            country: countryName,
            cookie: req.cookies
        }
    } catch (err) {
        console.log("🚀 ~ recordClientUserAgent ~ err:", err)
        return null
    }
}