"use strict";
function errorHandler(err, _req, res, _next) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
}
module.exports = { errorHandler };
//# sourceMappingURL=errorHandler.js.map