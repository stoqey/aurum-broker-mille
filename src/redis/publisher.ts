import redisPubSub from 'node-redis-pubsub';
import { redisConfig, RedisChannels } from '../config';

export const publishDataToChannel = (channel: RedisChannels, data) => {
    const redisPubSubClient = new redisPubSub(redisConfig);
    redisPubSubClient.emit(channel, { data });
}
