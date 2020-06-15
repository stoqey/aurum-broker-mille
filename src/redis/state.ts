import redis, { RedisClient } from 'redis';
import { promisify } from 'util';

/**
 * Save state
 Two ways
 - saveData(path, data)
 - getData(path)
 */

class State {

    redis: RedisClient = redis.createClient();

    private static _instance: State;

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private constructor() {
        console.log('---------------------- State', '----------------------')
    }

    /**
     * getData
     */
    public async getData(path: string): Promise<any> {
        let data = {};
        const client = this.redis;
        try {
            const savedData = await promisify(client.get).bind(client)(path);
            data = JSON.parse(savedData);
        }
        catch (error) {
            console.log('error getting data from redis', error);
        }
        finally {
            return data;
        }

    }

    /**
     * saveData
     */
    public async saveData(path: string, data: any): Promise<any> {
        let res = null;
        const client = this.redis;
        try {
            res = await promisify(client.set).bind(client)(path, JSON.stringify(data));
        }
        catch (error) {
            console.log('error getting data from redis', error);
        }
        finally {
            return res;
        }
    }


    /**
     * getMilleMarketState
     */
    public getMilleMarketState = async (): Promise<{ time: Date, symbols: string[] }> => {
        try {

            const milleMarket = await this.getData('markets');
            if (milleMarket && milleMarket.time) {
                return { time: milleMarket.time, symbols: milleMarket.symbols }
            }

        }
        catch (error) {
            console.log('error getting mille markets', error)
            return null;
        }
    }
}

export default State;