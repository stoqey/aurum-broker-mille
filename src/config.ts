require('dotenv').config();
export const isTest = process.env.NODE_ENV === 'test';
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
