import redisPubSub from 'node-redis-pubsub';
import {MILLEEVENTS} from '@stoqey/mille';
import {redisConfig, CustomBrokerEvents} from '../config';
import MilleBroker from '../MilleBroker';
import State from './state';
import {verbose} from '../log';
import {formatTimeForLog} from '../utils/time.utils';

const redisPubSubClient = new redisPubSub(redisConfig);

export const redisSubscribe = (broker: MilleBroker) => {
    const state = State.Instance;

    // on order
    redisPubSubClient.on(CustomBrokerEvents.ON_ORDER, (data) => {
        const onOrders = broker.events['onOrders'];

        if (onOrders) {
            onOrders(data);
        }
    });

    // on portfolio
    redisPubSubClient.on(CustomBrokerEvents.ON_PORTFOLIO, async (data) => {
        const onPortfolios = 'onPortfolios';
        const onPortfoliosFn = broker.events[onPortfolios];

        if (onPortfoliosFn) {
            await onPortfoliosFn(data);
        }
        if (broker.write) {
            // SET persist portfolios into redis
            await state.saveData(onPortfolios, data);
        }
    });

    // on market data
    redisPubSubClient.on(CustomBrokerEvents.ON_MARKET_DATA, (data) => {
        const onMarketData = broker.events['onMarketData'];

        if (onMarketData) {
            onMarketData(data);
        }
    });

    // onPriceUpdates
    redisPubSubClient.on(MILLEEVENTS.DATA, async (data) => {
        const onPriceUpdates = broker.events['onPriceUpdate'];
        const {symbol, tick} = data;

        // Bar save data
        if (broker.write) {
            // SET persist portfolios into redis
            await state.saveMarketBar(symbol, tick);
        }

        if (onPriceUpdates) {
            await onPriceUpdates({symbol, ...tick}); // price, volume, date
        }
    });

    // on time
    redisPubSubClient.on(MILLEEVENTS.TIME_TICK, async (data = {} as any) => {
        // const {  symbols, time }  = data;
        const market = 'markets';
        verbose(
            market,
            `--------time=${formatTimeForLog(data.time || new Date())} symbols= ${(
                data.symbols || []
            ).join(',')}`
        );

        if (broker.write) {
            // SET persist time and symbols into redis
            await state.saveData(market, data);
        }
    });

    return;
};

export const publishDataToRedisChannel = (channel: string, data) => {
    redisPubSubClient.emit(channel, data);
};
