/* eslint-disable @typescript-eslint/no-unused-vars */
import { isTest } from "./config";
import { mille, MILLEEVENTS, MilleEvents } from '@stoqey/mille';
import FinnhubAPI from '@stoqey/finnhub';
import { Broker, BrokerMethods, BrokerAccountSummary } from "@stoqey/aurum-broker-spec";

const virtualBrokerState: BrokerAccountSummary = {
    accountId: 'VIRTUAL',
    totalCashValue: 3000,
};

enum customEvents {
    ON_MARKET_DATA = 'on_market_data',
    GET_MARKET_DATA = 'get_market_data'
};

interface GetMarketData {
    symbol: string,
    startDate: Date,
    endDate?: Date,
    symbolType?: string
}

export class MilleBroker extends Broker implements BrokerMethods {

    /**
     * Emulated broker account summary
     */
    accountSummary: BrokerAccountSummary = virtualBrokerState;

    portfolios: any[] = []

    milleEvents: MilleEvents;
    constructor(date?: Date) {
        super();

        this.milleEvents = MilleEvents.Instance;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        // init all listeners
        this.init();


        if (isTest) {
            // fake trade
            setInterval(() => {
                const onTrade = self.events["onOrder"];
                onTrade && onTrade({ done: new Date });
            }, 1000)
        }

        // Init mille
        mille({ date, debug: false });

        // start after delay
        setTimeout(() => {
            const onReady = self.events["onReady"];
            if (onReady) {
                onReady({});
            }
        }, 2000);


    }

    /**
     * init
     */
    public init() {

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        const milleEvents = this.milleEvents;


        /**
         * Register all events here
         */
        milleEvents.on(MILLEEVENTS.DATA, (data) => {

            const onPriceUpdates = self.events["onPriceUpdate"];

            if (onPriceUpdates) {
                onPriceUpdates(data);
            }

        });

        milleEvents.on(customEvents.GET_MARKET_DATA, ({ symbol, startDate, endDate, range }) => {
            const finnhub = new FinnhubAPI(process.env.FINNHUB_KEY);

            async function getData() {
                const data = await finnhub.getCandles(symbol, startDate, endDate, range || '1');
                milleEvents.emit(customEvents.ON_MARKET_DATA, { symbol, marketData: data });
            }
            getData();
        });

        milleEvents.on(customEvents.ON_MARKET_DATA, (data) => {
            const onMarketData = self.events["onMarketData"];

            if (onMarketData) {
                onMarketData(data);
            }
        });
    }
    public async getAccountSummary(): Promise<BrokerAccountSummary> {
        return this.accountSummary;
    }

    getAllOrders(): Promise<any> {
        return null;
    }

    getOpenOrders(): Promise<any> {
        return null;
    }


    public async getAllPositions(): Promise<any> {
        return this.portfolios;
    }

    public async enterPosition(portfolio: any[]): Promise<any> {
        // use finnhub
        return null;
    }

    public async exitPosition(portfolio: any[]): Promise<any> {
        // use finnhub
        return null;
    }

    public async searchSymbol(symbol: string, symbolType: string): Promise<any> {
        // use finnhub
        return null;

    }
    public async quoteSymbol(symbol: string, symbolType: string): Promise<any> {
        // use finnhub
        return null;
    }

    // @ts-ignore
    public async getMarketData(args: GetMarketData): Promise<any> {
        const { symbol, startDate, endDate } = args;
        this.milleEvents.emit(customEvents.GET_MARKET_DATA, { symbol, startDate, endDate });
        // Can use finnhub
        return null;
    }

    // Complete
    public async getPriceUpdate(symbol: string, symbolType?: string): Promise<any> {
        this.milleEvents.emit(MILLEEVENTS.GET_DATA, [symbol]);
        return symbol;
    };

}

export default MilleBroker;