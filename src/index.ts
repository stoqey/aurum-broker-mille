/* eslint-disable @typescript-eslint/no-unused-vars */
import { isTest } from "./config";
import { mille, MILLEEVENTS, MilleEvents } from '@stoqey/mille'
import { Broker, BrokerMethods, BrokerAccountSummary } from "@stoqey/aurum-broker-spec";

const virtualBrokerState: BrokerAccountSummary = {
    accountId: 'VIRTUAL',
    totalCashValue: 3000,
};

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

    public async getMarketData(symbol: string, symbolType: string): Promise<any> {
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