export const success = (res, data, status = 200, meta = null) => {
    return res.status(status).json({
        success: true,
        data,
        meta
    });
};

export const failure = (
    res,
    code,
    message,
    status = 400,
    details = null
) => {
    return res.status(status).json({
        success: false,
        error: {
            code,
            message,
            details
        }
    });
};