/* eslint-disable @typescript-eslint/no-unused-vars */
import moment from 'moment';
import { isTest } from "./config";
import { mille, MILLEEVENTS, MilleEvents } from '@stoqey/mille';
import FinnhubAPI from '@stoqey/finnhub';
import { Broker, BrokerAccountSummary, Portfolio, SymbolInfo, GetSymbolData, OpenOrder } from "@stoqey/aurum-broker-spec";

const virtualBrokerState: BrokerAccountSummary = {
    accountId: 'VIRTUAL',
    totalCashValue: 3000,
};

enum customEvents {
    ON_MARKET_DATA = 'on_market_data',
    GET_MARKET_DATA = 'get_market_data',
    ADD_PORTFOLIO = 'add_portfolio',
    ON_PORTFOLIO = 'on_portfolio',
    CREATE_ORDER = 'create_order'
};

interface Order {
    symbol: string;
    type: 'BUY' | 'SELL',
    position: number; // number of share we want
    filled: number; // number of shares bought
}

export class MilleBroker extends Broker {
    /**
     * Emulated broker account summary
     */
    accountSummary: BrokerAccountSummary = virtualBrokerState;

    portfolios: Portfolio[] = [];

    startDate: Date;

    milleEvents: MilleEvents;
    constructor(date?: Date) {
        super();

        this.milleEvents = MilleEvents.Instance;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        this.startDate = date;

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
                onReady(true);
            }
        }, 2000);

    }

    /**
     * getPublicTime
     */
    public getPublicTime() {
        const timeAsString = moment(this.startDate).format("DD-MM-YYYY");
        return timeAsString;
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

        /**
         * Get market data
         */
        milleEvents.on(customEvents.GET_MARKET_DATA, ({ symbol, startDate, endDate, range }) => {
            const finnhub = new FinnhubAPI(process.env.FINNHUB_KEY);

            async function getData() {
                const data = await finnhub.getCandles(symbol, startDate, endDate, range || '1');
                milleEvents.emit(customEvents.ON_MARKET_DATA, { symbol, marketData: data });
            }
            getData();
        });

        /**
         * On market data received
         */
        milleEvents.on(customEvents.ON_MARKET_DATA, (data) => {
            const onMarketData = self.events["onMarketData"];

            if (onMarketData) {
                onMarketData(data);
            }
        });
    }

    public searchSymbol<T>(args: SymbolInfo & T): Promise<SymbolInfo & T[]> {
        throw new Error("Method not implemented.");
    }
    public quoteSymbol<T>(args: SymbolInfo & T): Promise<SymbolInfo & T> {
        throw new Error("Method not implemented.");
    }

    async getAccountSummary(): Promise<BrokerAccountSummary> {
        return this.accountSummary;
    }

    public getAllOrders(): Promise<any> {
        return null;
    }

    public getOpenOrders(): Promise<any> {
        return null;
    }


    public async getAllPositions(): Promise<any> {
        // Refresh all portfolios and update state to all
        return this.portfolios;
    }

    public async enterPosition(portfolio: Portfolio & any): Promise<any> {
        // setTimeout, 
        // -> createOrder BUY/SELL
        // -> emit onOrder
        // -> fillOrder
        // -> emit onOrder
        // -> updatePortfolios
        return null;
    }

    public async exitPosition(portfolio: Portfolio & any): Promise<any> {
        // setTimeout, 
        // Get if current position exists
        // -> createOrder BUY/SELL for exit
        // -> emit onOrder
        // -> fillOrder
        // -> emit onOrder
        // -> updatePortfolios
        setTimeout(() => {
            async function exitPosition() {
                try {




                }
                catch (error) {
                    console.log('error exiting position', error);
                }
            }
        }, 2000);
        return null;
    }

    public async getMarketData(args: GetSymbolData): Promise<any> {
        const { symbol, startDate, endDate } = args;
        this.milleEvents.emit(customEvents.GET_MARKET_DATA, { symbol, startDate, endDate });
        // Can use finnhub
        return null;
    }

    // Complete
    public async getPriceUpdate(args: GetSymbolData): Promise<any> {
        const { symbol, startDate, endDate } = args;
        this.milleEvents.emit(MILLEEVENTS.GET_DATA, [symbol]);
        return symbol;
    };

}

export default MilleBroker;