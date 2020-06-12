import ioredis, { Redis } from "ioredis";
import { REDIS_HOST } from "../config";

/**
 * Save state
 Two ways
 - saveData(path, data)
 - getData(path)
 */

export class State {

    redis: Redis;

    private static _instance: State;

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private constructor() {
        this.redis = new ioredis(null, REDIS_HOST);
    }

    /**
     * getData
     */
    public async getData(path: string): Promise<any> {
        let data = {};
        try {
            const savedData = await this.redis.get(path);
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
        try {
            res = await this.redis.set(path, JSON.stringify(data));
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
    public async getMilleMarketState(): Promise<{ time: Date, symbols: string[] }> {
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