import 'mocha';
import { MilleBroker } from '.';
import { OrderStock } from '@stoqey/ibkr';
import { Portfolio } from '@stoqey/aurum-broker-spec';

const broker = new MilleBroker(new Date("2020-03-10 09:30:00"));

before((done) => {
    broker.when('onReady', async () => {
        console.log('on ready');
        done();
    });
    broker.init();
});

const demoOrder: OrderStock = {
    symbol: "AAPL",
    action: "BUY",
    type: "market",
    parameters: [],
    size: 1,
    exitTrade: false
}


describe('Mille broker', () => {

    it(`Price updates`, (done) => {
        let completed = false;
        broker.when("onPriceUpdate", async (data: any) => {
            if (!completed) {
                console.log('on price updates data is', data);
                completed = true;
                done();
            }
        });

        broker.getPriceUpdate({ symbol: "AAPL", startDate: null });
    })

    it(`MarketData`, (done) => {
        let completed = false;
        const startDate = new Date("2020-03-10 09:30:00");
        const endDate = new Date("2020-03-13 09:30:00");

        broker.when("onMarketData", async ({ marketData = [], symbol }) => {
            if (!completed) {
                console.log('got market data' + symbol, marketData.length);
                completed = true;
                done();
            }
        });

        broker.getMarketData({ symbol: "AAPL", startDate, endDate });
    })

    it(`Buy Portfolio`, (done) => {
        let completed = false;
        broker.when("onPortfolios", async (portfolios: Portfolio[]) => {

            console.log('portfolios', JSON.stringify(portfolios));
            console.log('got portfolios', portfolios && portfolios.length);

            const portfolioCreated = portfolios.some(port => port.symbol === demoOrder.symbol);

            if (!completed) {
                console.log('got portfolios !completed', portfolios && portfolios.length);
                if (portfolioCreated) {
                    completed = true;
                    done();
                }
            }


        });

        broker.enterPosition(demoOrder)
    })

    it(`Sell Portfolio`, (done) => {
        let completed = false;
        demoOrder.exitTrade = true;
        demoOrder.action = "SELL";

        broker.when("onPortfolios", async (portfolios: Portfolio[]) => {

            console.log('portfolios', JSON.stringify(portfolios));
            console.log('got portfolios', portfolios && portfolios.length);

            const portfolioExists = portfolios.some(port => port.symbol === demoOrder.symbol);

            if (!completed) {
                console.log('got portfolios !completed', portfolios && portfolios.length);
                if (!portfolioExists) {
                    completed = true;
                    done();
                }
            }

        });

        broker.exitPosition(demoOrder)
    })
})