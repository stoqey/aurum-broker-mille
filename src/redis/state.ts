import ioredis, { Redis } from "ioredis";

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
        this.redis = new ioredis();
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
}