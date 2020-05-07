import { PubsubManager } from 'redis-messaging-manager';
import { REDIS_HOST } from '../config';

const messenger = new PubsubManager({
    host: REDIS_HOST,
});
export default messenger;