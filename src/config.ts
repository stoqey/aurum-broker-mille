require('dotenv').config();
export const isTest = process.env.NODE_ENV === 'test';
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = process.env.REDIS_PORT || 6379;

export const redisConfig = {
    port: REDIS_PORT,
    scope: 'mille',
};

export type RedisChannels = 'symbols' | 'portfolios' | 'time' | 'orders';

export enum CustomBrokerEvents {
    ON_MARKET_DATA = 'on_market_data',
    GET_MARKET_DATA = 'get_market_data',
    ADD_PORTFOLIO = 'add_portfolio',
    ON_PORTFOLIO = 'on_portfolio',
    CREATE_ORDER = 'create_order',
    ON_ORDER = 'on_order',
}
