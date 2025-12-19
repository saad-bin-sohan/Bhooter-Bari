import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from './config.js';
export const signMemberToken = (payload) => {
    return jwt.sign(payload, config.memberTokenSecret, { expiresIn: '2h' });
};
export const verifyMemberToken = (token) => {
    try {
        return jwt.verify(token, config.memberTokenSecret);
    }
    catch (e) {
        return null;
    }
};
export const signAdminToken = () => jwt.sign({ role: 'admin' }, config.adminSecret, { expiresIn: '12h' });
export const verifyAdminToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.adminSecret);
        if (decoded.role !== 'admin')
            return null;
        return decoded;
    }
    catch (e) {
        return null;
    }
};
export const safeCompare = (a, b) => {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length)
        return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
};
