export function errorHandler(err, _req, res, _next) {
    console.error('Error:', err.message);
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    res.status(statusCode).json({ success: false, error: message });
}
