
import redisPubSub from 'node-redis-pubsub';
import { MILLEEVENTS } from '@stoqey/mille'
import { redisConfig, CustomBrokerEvents } from '../config'
import MilleBroker from '../MilleBroker';
import { log } from '../log';


export const redisSubscribe = (milleBroker: MilleBroker) => {
    const redisPubSubClient = new redisPubSub(redisConfig);

    // on order
    redisPubSubClient.on(CustomBrokerEvents.ON_ORDER, (data) => {
        const onOrders = milleBroker.events["onOrders"];

        if (onOrders) {
            onOrders(data);
        }
    });

    // on portfolio
    redisPubSubClient.on(CustomBrokerEvents.ON_PORTFOLIO, (data) => {
        const onPortfolios = milleBroker.events["onPortfolios"];

        if (onPortfolios) {
            onPortfolios(data);
        }
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
    redisPubSubClient.on(MILLEEVENTS.TIME_TICK, function (data) {
        log("MILLEEVENTS.TIME_TICK", + data)
    });
}

export const publishDataToRedisChannel = (channel: string, data) => {
    const redisPubSubClient = new redisPubSub(redisConfig);
    redisPubSubClient.emit(channel, { data });
}

