import redis, {RedisClient} from 'redis';
import {promisify} from 'util';
import {log} from '../log';
import {Portfolio} from '@stoqey/aurum-broker-spec';

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

    private constructor() {}

    /**
     * getData
     */
    public async getData(path: string): Promise<any> {
        let data = {};
        const client = this.redis;
        try {
            const savedData = await promisify(client.get).bind(client)(path);
            data = JSON.parse(savedData);
        } catch (error) {
            log('error getting data from redis', error);
        } finally {
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
        } catch (error) {
            log('error getting data from redis', error);
        } finally {
            return res;
        }
    }

    /**
     * getMilleMarketState
     */
    public getMilleMarketState = async (): Promise<{time: Date; symbols: string[]}> => {
        try {
            const milleMarket = await this.getData('markets');
            if (milleMarket && milleMarket.time) {
                return {time: milleMarket.time, symbols: milleMarket.symbols};
            }
        } catch (error) {
            log('error getting mille markets', error);
            return null;
        }
    };

    public getPortfolios = async (): Promise<Portfolio[]> => {
        let portfolios = null;
        try {
            portfolios = await this.getData('onPortfolios');
        } catch (error) {
            log('error getting mille portfolios', error);
        } finally {
            return portfolios;
        }
    };

    /**
     * Save MarketBar
     * @param symbol
     * @param bar
     */
    public saveMarketBar = async (
        symbol: string,
        bar: {date: Date; close: number}
    ): Promise<{date: Date; close: number}> => {
        try {
            await this.saveData(`bar:${symbol}`, bar);
        } catch (error) {
            log('error getting mille portfolios', error);
        } finally {
            return bar;
        }
    };

    /**
     * Get MarketBar
     * @param symbol
     */
    public getMarketBar = async (symbol: string): Promise<{date: Date; close: number}> => {
        let bar = null;
        try {
            bar = await this.getData(`bar:${symbol}`);
        } catch (error) {
            log('error getting mille portfolios', error);
        } finally {
            return bar;
        }
    };

    /**
     * deleteAll
     */
    public async deleteAll(): Promise<boolean> {
        try {
            await this.redis.flushall();
            return true;
        } catch (error) {
            log('error flushing all', error);
            return false;
        }
    }
}

export default State;
