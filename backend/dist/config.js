import dotenv from 'dotenv';
dotenv.config();
const num = (value, fallback) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed))
        return parsed;
    return fallback;
};
const ADMIN_ROUTE_PREFIX_PATTERN = /^\/[A-Za-z0-9_-]+$/;
const parseFrontendOrigins = (value) => {
    if (!value)
        return [];
    const uniqueOrigins = new Set();
    for (const rawOrigin of value.split(',')) {
        const origin = rawOrigin.trim();
        if (!origin)
            continue;
        try {
            const parsed = new URL(origin);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                console.warn(`Ignoring FRONTEND_ORIGINS entry with unsupported protocol: ${origin}`);
                continue;
            }
            uniqueOrigins.add(origin);
        }
        catch {
            console.warn(`Ignoring invalid FRONTEND_ORIGINS entry: ${origin}`);
        }
    }
    return [...uniqueOrigins];
};
const resolveAdminRoutePrefix = (value, nodeEnv) => {
    const envValue = value?.trim();
    if (!envValue) {
        if (nodeEnv === 'production') {
            throw new Error('Missing ADMIN_ROUTE_PREFIX in production. Set a private single-segment path like /k9X2mTq4pR8.');
        }
        return '/admin';
    }
    if (!ADMIN_ROUTE_PREFIX_PATTERN.test(envValue)) {
        throw new Error('Invalid ADMIN_ROUTE_PREFIX. Use exactly one path segment: /^\\/[A-Za-z0-9_-]+$/.');
    }
    return envValue;
};
export const config = {
    port: num(process.env.PORT, 4000),
    frontendOrigins: parseFrontendOrigins(process.env.FRONTEND_ORIGINS),
    adminUsername: process.env.ADMIN_PANEL_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PANEL_PASSWORD || 'password',
    adminSecret: process.env.ADMIN_SESSION_SECRET || 'change-me',
    adminRoutePrefix: resolveAdminRoutePrefix(process.env.ADMIN_ROUTE_PREFIX, process.env.NODE_ENV),
    memberTokenSecret: process.env.MEMBER_TOKEN_SECRET || process.env.ADMIN_SESSION_SECRET || 'change-me',
    roomCreationLimit: num(process.env.ROOM_CREATION_HOURLY_LIMIT, 3)
};
