"use strict";
const express = require('express');
const cors = require('cors');
const path = require('path');
const router = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const app = express();
const PORT = process.env.PORT || 5053;
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'KM-Portal',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
app.use('/api', router);
app.use(express.static(path.join(__dirname, '../client')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`KM-Portal server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
//# sourceMappingURL=index.js.map