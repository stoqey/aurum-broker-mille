/* eslint-disable @typescript-eslint/no-unused-vars */
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import { isTest } from "./config";
import { mille, MILLEEVENTS, MilleEvents } from '@stoqey/mille';
import { OrderStock } from '@stoqey/ibkr'
import FinnhubAPI from '@stoqey/finnhub';
import { Broker, BrokerAccountSummary, Portfolio, SymbolInfo, GetSymbolData, OpenOrder } from "@stoqey/aurum-broker-spec";
import { setTimeout } from 'timers';

/**
 * Init broker state
 */

const placingOrderDelay = 3000;
const orderFillingDelay = 1000;

const virtualBrokerState: BrokerAccountSummary = {
    accountId: 'VIRTUAL',
    totalCashValue: 3000,
};

enum customEvents {
    ON_MARKET_DATA = 'on_market_data',
    GET_MARKET_DATA = 'get_market_data',
    ADD_PORTFOLIO = 'add_portfolio',
    ON_PORTFOLIO = 'on_portfolio',
    CREATE_ORDER = 'create_order',
    ON_ORDER = 'on_order'
};

/**
 * Mille Broker
 * 
 * - Get start from redis
 */
export class MilleBroker extends Broker {
    /**
     * Emulated broker account summary
     */
    accountSummary: BrokerAccountSummary = virtualBrokerState;

    portfolios: { [x: string]: Portfolio } = {} as any;

    orders: OrderStock[] = [];

    startDate: Date;

    milleEvents: MilleEvents;

    constructor(date: Date) {
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


        // For orders and portfolios
        /**
         * On portfolios data received
         */
        milleEvents.on(customEvents.ON_PORTFOLIO, (data) => {
            const onPortfolios = self.events["onPortfolios"];

            if (onPortfolios) {
                onPortfolios(data);
            }
        });

        /**
         * On market data received
         */
        milleEvents.on(customEvents.ON_ORDER, (data) => {
            const onOrders = self.events["onOrders"];

            if (onOrders) {
                onOrders(data);
            }
        });

        /**
         * Order execution/filling
         * Splice one item from orders, then process it
         * If exit
         *  - Remove from portfolio
         * If not exit
         *  - Add to portfolio
         * 
         * ALL
         * - Remove from orders list after processing
         */

        setInterval(async () => {

            if (!isEmpty(self.orders)) {

                const orderToProcess = self.orders.shift();
                const { symbol, size, exitTrade } = orderToProcess;

                if (exitTrade) {
                    delete self.portfolios[symbol];
                    console.log('portfolio delete exit', symbol)
                }
                else {
                    // create new portfolio
                    const newPortfolio: Portfolio = {
                        symbol,
                        position: size,
                        averageCost: 0,
                        marketPrice: 0
                    };

                    self.portfolios[symbol] = newPortfolio;
                    console.log('portfolio update new', Object.keys(self.portfolios))
                }

                const currentPortfolios = await self.getAllPositions();

                // emit update portfolios
                milleEvents.emit(customEvents.ON_PORTFOLIO, currentPortfolios);

            }
        }, orderFillingDelay)
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

    public getOpenOrders = <T>(): Promise<any & T[]> => {
        return Promise.resolve(this.orders);
    }


    public getAllPositions = async <T>(): Promise<any & T[]> => {
        // Refresh all portfolios and update state to all
        return Object.values(this.portfolios);
    }

    /**
     * Check if symbol exists in current portfolio
     */
    private isExistInPortfolio = (symbol): boolean => {
        return typeof this.portfolios[symbol] !== 'undefined';
    }

    /**
     * Check if symbol exists in current open orders
     */
    private isExistInOrders = (symbol, action): boolean => {
        return this.orders.some(order => order.symbol === symbol && order.action === action);
    }

    private placeOrder = (order: OrderStock) => {
        this.orders.push(order);
        this.milleEvents.emit(customEvents.ON_ORDER, [order]);
    }

    public enterPosition = async <T>(order: OrderStock & T): Promise<any> => {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const { symbol, action } = order;

        if (this.isExistInPortfolio(symbol)) {
            // 
            return console.log('error portfolio already exist')
        }

        if (this.isExistInOrders(symbol, action)) {
            // 
            return console.log('error order already exist')
        }

        // Add order to queue
        setTimeout(() => {
            console.log('placing order', `symbol=${symbol}, action=${action}`)
            self.placeOrder(order);
        }, placingOrderDelay);

        return true;
    }

    public exitPosition = async <T>(order: OrderStock & T): Promise<any> => {

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const { symbol, action } = order;

        if (!this.isExistInPortfolio(symbol)) {
            return console.log('error portfolio does not exist')
        }

        if (this.isExistInOrders(symbol, action)) {
            return console.log('error order already exist')
        }

        // Add order to queue
        setTimeout(() => {
            self.placeOrder(order);
        }, placingOrderDelay);

        return true;

        // setTimeout, 
        // Get if current position exists
        // -> createOrder BUY/SELL for exit
        // -> emit onOrder
        // -> fillOrder
        // -> emit onOrder
        // -> updatePortfolios
    }

    public getMarketData = async (args: GetSymbolData): Promise<any> => {
        const { symbol, startDate, endDate } = args;
        this.milleEvents.emit(customEvents.GET_MARKET_DATA, { symbol, startDate, endDate });
        // Can use finnhub
        return null;
    }

    // Complete
    public getPriceUpdate = async (args: GetSymbolData): Promise<any> => {
        const { symbol, startDate, endDate } = args;
        this.milleEvents.emit(MILLEEVENTS.GET_DATA, [symbol]);
        return symbol;
    };

}

export default MilleBroker;