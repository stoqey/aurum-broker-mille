
import redisPubSub from 'node-redis-pubsub';
import { MILLEEVENTS } from '@stoqey/mille'
import { redisConfig, CustomBrokerEvents } from '../config'
import MilleBroker from '../MilleBroker';
import State from './state';
import { log, verbose } from '../log';

const redisPubSubClient = new redisPubSub(redisConfig);

export const redisSubscribe = (milleBroker: MilleBroker) => {
    verbose('<-------------------------- redisSubscribe redisSubscribe', '---------------------------->')

    const state = State.Instance;

    // on order
    redisPubSubClient.on(CustomBrokerEvents.ON_ORDER, (data) => {
        const onOrders = milleBroker.events["onOrders"];

        if (onOrders) {
            onOrders(data);
        }
    });

    // on portfolio
    redisPubSubClient.on(CustomBrokerEvents.ON_PORTFOLIO, async (data) => {

        const onPortfolios = 'onPortfolios';
        const onPortfoliosFn = milleBroker.events[onPortfolios];

        if (onPortfoliosFn) {
            await onPortfoliosFn(data);
        }
        // SET persist portfolios into redis
        await state.saveData(onPortfolios, data)
    });

    // on market data
    redisPubSubClient.on(CustomBrokerEvents.ON_MARKET_DATA, (data) => {
        const onMarketData = milleBroker.events["onMarketData"];

        if (onMarketData) {
            onMarketData(data);
        }
    });

    // onPriceUpdates
    redisPubSubClient.on(MILLEEVENTS.DATA, (data) => {
        const onPriceUpdates = milleBroker.events["onPriceUpdate"];
        const { symbol, tick } = data;
        if (onPriceUpdates) {
            onPriceUpdates({ symbol, ...tick }); // price, volume, date
        }
    });

    // on time
    redisPubSubClient.on(MILLEEVENTS.TIME_TICK, async (data) => {
        // const {  symbols, time }  = data;
        const market = "markets";
        log(market, data)
        // SET persist time and symbols into redis
        await state.saveData(market, data);
    });

    return;
}

export const publishDataToRedisChannel = (channel: string, data) => {
    redisPubSubClient.emit(channel, data);
}

