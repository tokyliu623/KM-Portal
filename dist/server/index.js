import express from 'express';
import cors from 'cors';
import router from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
const app = express();
const PORT = process.env.PORT || 5053;
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use('/api', router);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'KM-Portal',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`KM-Portal server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
//# sourceMappingURL=index.js.map