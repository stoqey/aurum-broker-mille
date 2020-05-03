/* eslint-disable @typescript-eslint/no-unused-vars */
import { mille, MILLEEVENTS, MilleEvents } from '@stoqey/mille'
import { Broker, BrokerMethods } from "@stoqey/aurum-broker-spec";
import { isTest } from "./config";


// milleEvents.emit(MILLEEVENTS.GET_DATA, ["AAPL", "MSFT"])

export class MilleBroker extends Broker implements BrokerMethods { 
    // events = {} as any;

    milleEvents: MilleEvents;
    constructor() {
        super();

        this.milleEvents = MilleEvents.Instance;

        if (isTest) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this;
            setInterval(() => {
                const onTrade = self.events["onTrade"];
                onTrade({ done: new Date });
            }, 1000)
        }

        // TODO init mille
        // 
        mille();

    }

    public async getAllPositions(): Promise<any> {
        return {}
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
    public async getPriceUpdate(symbol: string, symbolType: string): Promise<any> {
        this.milleEvents.emit(MILLEEVENTS.GET_DATA, [symbol]);
        return symbol;
    };

}

export default MilleBroker;