import { v4 as uuidv4 } from 'uuid';
export function generateId() {
    return uuidv4();
}
export function maskToken(token) {
    if (token.length <= 8)
        return '****';
    return token.substring(0, 4) + '****' + token.substring(token.length - 4);
}
export function getClientIp(req) {
    return (req.headers['x-forwarded-for'] || req.ip || 'unknown');
}
export function generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
