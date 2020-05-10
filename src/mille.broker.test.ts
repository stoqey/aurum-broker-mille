import 'mocha';
import { MilleBroker } from '.';

const milleBroker = new MilleBroker();

before((done) => {
    milleBroker.when('onReady', async () => {
        console.log('on ready');
        done();
    });
});

describe('Mille broker', () => {

    it(`Price updates`, (done) => {

        milleBroker.when("onPriceUpdate", async (data: any) => {
            console.log('on price updates data is', data);
            done();
        });

        milleBroker.getPriceUpdate({ symbol: "AAPL", startDate: null });
    })

    it(`MarketData`, (done) => {

        const startDate = new Date("2020-03-10 09:30:00");
        const endDate = new Date("2020-03-13 09:30:00");

        milleBroker.when("onMarketData", async ({ marketData = [], symbol }) => {
            console.log('got market data' + symbol, marketData.length);
            done();
        });

        milleBroker.getMarketData({ symbol: "AAPL", startDate, endDate });
    })
})