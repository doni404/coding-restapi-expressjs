export function checkBody(req, res, next) {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            code: "error",
            message: "Bad Request: Body is empty."
        });
    }
    next();
}