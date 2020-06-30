import 'mocha';
import { MilleBroker } from '.';
import { OrderStock } from '@stoqey/ibkr';
import { Portfolio } from '@stoqey/aurum-broker-spec';
import { log } from './log';

const demoOrder: OrderStock = {
    symbol: "AAPL",
    action: "BUY",
    type: "market",
    parameters: [],
    size: 1,
    exitTrade: false
}

const broker = new MilleBroker(new Date("2020-03-12 09:30:00"), { resume: false, write: true, processOrders: true });

before((done) => {

    broker.when('onReady', async () => {
        log('on ready');
        done();
    });
    broker.init();

})


describe('Mille broker', () => {

    // it(`Price updates`, (done) => {
    //     let completed = false;

    //     const startDate = new Date("2020-03-10 09:30:00");
    //     broker.when("onPriceUpdate", async (data: any) => {
    //         if (!completed) {
    //             log('on price updates data is', data);
    //             completed = true;
    //             done();
    //         }
    //     });

    //     broker.getPriceUpdate({ symbol: "AAPL", startDate });
    // })

    it(`MarketData`, (done) => {
        let completed = false;
        const startDate = new Date("2020-03-10 09:30:00");
        const endDate = new Date("2020-03-13 09:30:00");

        broker.when("onMarketData", async ({ marketData = [], symbol }) => {
            if (!completed) {
                log('got market data' + symbol, marketData.length);
                completed = true;
                done();
            }
        });

        broker.getMarketData({ symbol: "AAPL", startDate, endDate });
    })

    it(`MarketData withoutEndDate`, (done) => {
        let completed = false;
        const startDate = new Date("2020-03-10 09:30:00");
        // const endDate = new Date("2020-03-13 09:30:00");

        broker.when("onMarketData", async ({ marketData = [], symbol }) => {
            if (!completed) {
                log('got market data' + symbol, marketData.length);
                completed = true;
                done();
            }
        });

        broker.getMarketData({ symbol: "AAPL", startDate });
    })
})