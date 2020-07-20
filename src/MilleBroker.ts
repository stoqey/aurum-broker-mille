/* eslint-disable @typescript-eslint/no-unused-vars */
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import {isTest, CustomBrokerEvents as customEvents} from './config';
import {mille, MILLEEVENTS, MilleEvents, Start} from '@stoqey/mille';
import {OrderStock, OrderWithContract} from '@stoqey/ibkr';
import FinnhubAPI, {Resolution} from '@stoqey/finnhub';
import {
    Broker,
    BrokerAccountSummary,
    Portfolio,
    SymbolInfo,
    GetSymbolData,
} from '@stoqey/aurum-broker-spec';
import {log, verbose} from './log';
import {publishDataToRedisChannel, redisSubscribe} from './redis/subscribe';
import State from './redis/state';
import {delay} from './promise.utils';
import {formatTimeForLog} from './utils/time.utils';

interface CustomBrokerMethods {
    createSale?: (order: any, portfolio: any) => Promise<any>;
    savePortfolio?: (data: any, deletePortfolio?: boolean) => Promise<any>;
}
interface OptionsArgs {
    state?: BrokerAccountSummary;
    write?: boolean;
    resume?: boolean;
    processOrders?: boolean;
    methods?: CustomBrokerMethods;
    mille?: Start; // mille options
}
/**
 * Init broker state
 */

const placingOrderDelay = 3000;
const orderFillingDelay = 1000;

const virtualBrokerState: BrokerAccountSummary = {
    accountId: 'VIRTUAL',
    totalCashValue: 3000,
};

const redisState = State.Instance;

/**
 * Mille Broker
 *
 * - Get start from redis
 */
export class MilleBroker extends Broker implements CustomBrokerMethods {
    /**
     * Emulated broker account summary
     */
    accountSummary: BrokerAccountSummary = virtualBrokerState;

    portfolios: {[x: string]: Portfolio} = {} as any;

    orders: OrderStock[] = [];

    startDate: Date;

    milleEvents: MilleEvents;

    start: Date;
    write = false;
    resume = false;
    processOrders = false;
    mille: Start = null;

    // other methods
    createSale?: (order: any, portfolio: any) => Promise<any> = async () => {};
    savePortfolio?: (data: any, deletePortfolio?: boolean) => Promise<any> = async () => {};

    constructor(date: Date, options?: OptionsArgs) {
        super();

        this.milleEvents = MilleEvents.Instance;
        // eslint-disable-next-line @typescript-eslint/no-this-alias

        const {
            state = null,
            write = false,
            resume = false,
            processOrders = false,
            methods = null,
            mille = null,
        } = options || {};

        this.start = date;
        this.write = write;
        this.resume = resume;
        this.processOrders = processOrders;
        this.mille = mille;

        // set methods
        if (methods) {
            this.createSale = methods && methods.createSale;
            this.savePortfolio = methods && methods.savePortfolio;
        }

        if (state) {
            this.accountSummary = state;
        }
    }

    /**
     * init
     */
    public init() {
        this.startMilleBroker();
    }

    async startMilleBroker() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        const {start, write, resume} = this;

        const date = new Date(start);

        if (resume) {
            const marketState = await redisState.getMilleMarketState();

            verbose('marketState', marketState);
            if (marketState && marketState.time) {
                // Get last starting time and set it as start and use previous symbols
                self.startDate = marketState.time;

                if (write) {
                    // emit all symbols
                    setTimeout(async () => {
                        verbose('adding all previous symbols');

                        const symbols = marketState.symbols;

                        while (symbols.length > 0) {
                            const symbolX = symbols.shift();
                            self.getPriceUpdate({symbol: symbolX, startDate: self.startDate});
                            await delay(1000, 'some string');
                        }
                    }, 5000);
                }
            }
        } else {
            self.startDate = date;

            // Delete all from redis stuff
            await redisState.deleteAll();
        }

        // init all listeners
        redisSubscribe(self);

        self.initialise();

        if (isTest) {
            // fake trade
            setInterval(() => {
                const onTrade = self.events['onOrder'];
                onTrade && onTrade({done: new Date()});
            }, 1000);
        }

        log(
            '--------------Mille--------------> startDate ' +
                moment(self.startDate).format('DD/MM/YYYY')
        );

        if (write) {
            if (self.mille) {
                mille(self.mille);
            } else {
                // Init default mille
                mille({
                    startDate: new Date('2020-03-11 10:35:00'),
                    endDate: new Date('2020-03-11 16:35:00'),
                    mode: 'secs',
                });
            }
        }

        // start after delay
        setTimeout(() => {
            const onReady = self.events['onReady'];
            if (onReady) {
                onReady(true);
            }
        }, 2000);
    }

    /**
     * initialise
     */
    private initialise() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        const milleEvents = this.milleEvents;

        /**
         * Register all events here
         */

        /**
         * Time tick
         */
        milleEvents.on(MILLEEVENTS.TIME_TICK, (data) => {
            publishDataToRedisChannel(MILLEEVENTS.TIME_TICK, data);
        });

        /**
         * Get price update data
         */
        milleEvents.on(MILLEEVENTS.DATA, (data) => {
            publishDataToRedisChannel(MILLEEVENTS.DATA, data);
        });

        /**
         * HandleGetMarketData request
         * @param param0
         */
        const handleGetMarketData = ({symbol, startDate, endDate, range = '1'}): void => {
            const finnhub = new FinnhubAPI(process.env.FINNHUB_KEY);

            async function getData() {
                verbose(
                    `handleGetMarketData symbol=${symbol}`,
                    `startDate=${formatTimeForLog(startDate)} endDate=${formatTimeForLog(
                        endDate
                    )} range=${range}`
                );

                /**
                 * use startDate as end @aka to
                 * use endDate as start @aka from
                 */
                const data = await finnhub.getCandles(
                    symbol,
                    startDate,
                    endDate,
                    range as Resolution
                );

                // TODO save save to redis
                publishDataToRedisChannel(customEvents.ON_MARKET_DATA, {symbol, marketData: data});
            }
            getData();
        };

        /**
         * Get market data
         */
        milleEvents.on(customEvents.GET_MARKET_DATA, handleGetMarketData);

        /**
         * On market data received
         */
        milleEvents.on(customEvents.ON_MARKET_DATA, (data) => {
            publishDataToRedisChannel(customEvents.ON_MARKET_DATA, data);
        });

        /**
         * On portfolios data received
         */
        milleEvents.on(customEvents.ON_PORTFOLIO, (data) => {
            publishDataToRedisChannel(customEvents.ON_PORTFOLIO, data);
        });

        /**
         * On market data received
         */
        milleEvents.on(customEvents.ON_ORDER, (data) => {
            publishDataToRedisChannel(customEvents.ON_ORDER, data);
        });

        if (self.processOrders) {
            setInterval(async () => {
                if (!isEmpty(self.orders)) {
                    const orderToProcess: OrderStock = self.orders.shift();

                    const {
                        symbol,
                        exitParams = null,
                        exitTrade,
                        capital = 1000,
                        size,
                        action,
                    } = orderToProcess;

                    // Get current quote
                    const currentBar = await self.quoteSymbol({symbol});

                    const orderWithContract: OrderWithContract = {
                        orderState: {
                            status: 'Filled',
                            initMargin: '',
                            maintMargin: '',
                            equityWithLoan: '',
                            commission: 0,
                            minCommission: 0,
                            maxCommission: 0,
                            commissionCurrency: '',
                            warningText: '',
                        },
                        symbol,
                        action,
                        totalQuantity: size,
                        lmtPrice: currentBar.close,
                    } as any;

                    const defaultPortfolioSize =
                        orderToProcess.size || Math.round(capital / currentBar.close);

                    // Exit trade
                    if (exitTrade && exitParams && exitParams.exitTime) {
                        const {exitPrice, exitTime, entryPrice, entryTime} = exitParams;
                        const portfolio = self.portfolios[symbol];

                        let portfolioCopy = null;
                        portfolioCopy = portfolio;

                        // update with close params
                        portfolioCopy.exitTime = exitTime;
                        portfolioCopy.exitPrice = exitPrice;
                        portfolioCopy.entryPrice = entryPrice;
                        portfolioCopy.entryTime = entryTime;

                        delete self.portfolios[symbol];
                        verbose('portfolio delete exit', symbol);

                        // emit update portfolios
                        publishDataToRedisChannel(customEvents.ON_ORDER, [
                            {...orderWithContract, date: new Date(currentBar.date)},
                        ]);
                        // TODO emit as order
                        // await self.savePortfolio(portfolio, true); // save portfolio to initializer
                        // await self.createSale(orderToProcess, portfolioCopy); // create sale to initializer
                        verbose('sale created', symbol);
                    } else {
                        // create new portfolio
                        const newPortfolio: Portfolio = {
                            name: symbol,
                            id: symbol,
                            symbol,
                            position: defaultPortfolioSize,
                            capital,
                            averageCost: currentBar.close,
                            marketPrice: currentBar.close,
                            entryPrice: currentBar.close,
                            entryTime: new Date(currentBar.date),
                            tradeType: action,
                        };

                        self.portfolios[symbol] = newPortfolio;
                        log('portfolio update new', Object.keys(self.portfolios));
                        // await self.savePortfolio(newPortfolio); // save portfolio to initializer
                    }

                    const currentPortfolios = await self.getAllPositions();

                    // emit update portfolios
                    publishDataToRedisChannel(customEvents.ON_PORTFOLIO, currentPortfolios);
                }
            }, orderFillingDelay);
        }
    }

    /**
     * getPublicTime
     */
    public getPublicTime() {
        const timeAsString = moment(this.startDate).format('DD-MM-YYYY');
        return timeAsString;
    }

    private emit(channel: string, data: any) {
        if (this.write) {
            publishDataToRedisChannel(channel, data);
        }
    }

    public searchSymbol<T>(args: SymbolInfo & T): Promise<SymbolInfo & T[]> {
        throw new Error('Method not implemented.');
    }
    public async quoteSymbol<T>(
        args: SymbolInfo & T
    ): Promise<{date: Date; close: number; symbol: string} & any> {
        const {symbol} = args;
        const barData = {date: new Date(), close: 0, symbol};
        try {
            const redisBarData = await redisState.getMarketBar(symbol);
            if (redisBarData) {
                barData.close = redisBarData.close;
                barData.date = redisBarData.date;
            }
        } catch (error) {
            console.log('error quotingSymbol', error);
        } finally {
            return barData;
        }
    }

    public getScreener(): <T>(args: any) => Promise<any & T[]> {
        return null;
    }

    async getAccountSummary(): Promise<BrokerAccountSummary> {
        return this.accountSummary;
    }

    public getAllOrders(): Promise<any> {
        return this.getOpenOrders();
    }

    public getOpenOrders = <T>(): Promise<any & T[]> => {
        return Promise.resolve(this.orders);
    };

    public getAllPositions = async <T>(): Promise<any & T[]> => {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const savedPositions = await redisState.getPortfolios();
        if (!isEmpty(savedPositions)) {
            savedPositions.forEach((position) => {
                const symbol = position && position.symbol;
                // Update position
                self.portfolios[symbol] = {
                    ...(self.portfolios[symbol] || {}),
                    ...position,
                };
            });
        }

        const portfolios = Object.values(self.portfolios);

        this.milleEvents.emit(customEvents.ON_PORTFOLIO, portfolios);

        // Refresh all portfolios and update state to all
        return portfolios;
    };

    /**
     * Check if symbol exists in current portfolio
     */
    private isExistInPortfolio = (symbol): boolean => {
        return typeof this.portfolios[symbol] !== 'undefined';
    };

    /**
     * Check if symbol exists in current open orders
     */
    private isExistInOrders = (symbol, action): boolean => {
        return this.orders.some((order) => order.symbol === symbol && order.action === action);
    };

    private placeOrder = (order: OrderStock) => {
        this.orders.push(order);
        this.emit(customEvents.ON_ORDER, this.orders);
    };

    public enterPosition = async <T>(order: OrderStock & T): Promise<any> => {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const {symbol, action} = order;

        if (this.isExistInPortfolio(symbol)) {
            //
            return log('error portfolio already exist');
        }

        if (this.isExistInOrders(symbol, action)) {
            //
            return log('error order already exist');
        }

        // Add order to queue
        setTimeout(() => {
            log('placing enter order', `symbol=${symbol}, action=${action}`);
            self.placeOrder(order);
        }, placingOrderDelay);

        return true;
    };

    public exitPosition = async <T>(order: OrderStock & T): Promise<any> => {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const {symbol, action} = order;

        if (!this.isExistInPortfolio(symbol)) {
            return log('error portfolio does not exist');
        }

        if (this.isExistInOrders(symbol, action)) {
            return log('error order already exist');
        }

        // Add order to queue
        setTimeout(() => {
            log('placing exit order', `symbol=${symbol}, action=${action}`);
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
    };

    public getMarketData = async (args: GetSymbolData): Promise<any> => {
        const {symbol, startDate} = args;

        const cloneStartDate = new Date(startDate);
        const endDate = new Date(
            args.endDate || cloneStartDate.setDate(cloneStartDate.getDate() + 1)
        );

        this.milleEvents.emit(customEvents.GET_MARKET_DATA, {symbol, startDate, endDate});
        // Can use finnhub
        return null;
    };

    // Complete
    public getPriceUpdate = async (args: GetSymbolData): Promise<any> => {
        const {symbol} = args;
        this.milleEvents.emit(MILLEEVENTS.GET_DATA, [symbol]);
        return symbol;
    };
}

export default MilleBroker;
