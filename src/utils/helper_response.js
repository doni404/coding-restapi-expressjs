// This is global response pattern
export function response(code, message, data) {
    return {
        code,
        message,
        data
    }
}

export function responseWithoutData(code, message) {
    return {
        code,
        message
    }
}