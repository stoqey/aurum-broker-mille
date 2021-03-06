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

const broker = new MilleBroker(new Date("2020-03-10 09:30:00"), { resume: false, write: false, processOrders: true });

before((done) => {

    broker.when('onReady', async () => {
        log('on ready');
        done();
    });
    broker.init();

})
describe('Mille broker', () => {

    it(`Buy Portfolio`, (done) => {


        let completed = false;
        broker.when("onPortfolios", async (portfolios: Portfolio[]) => {

            log('portfolios', JSON.stringify(portfolios));
            log('got portfolios', portfolios && portfolios.length);

            const portfolioCreated = portfolios.some(port => port.symbol === demoOrder.symbol);

            if (!completed) {
                log('got portfolios !completed', portfolios && portfolios.length);
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
        demoOrder.exitParams = { entryPrice: 0 } as any;

        broker.when("onPortfolios", async (portfolios: Portfolio[]) => {

            log('portfolios', JSON.stringify(portfolios));
            log('got portfolios', portfolios && portfolios.length);

            const portfolioExists = portfolios.some(port => port.symbol === demoOrder.symbol);

            if (!completed) {
                log('got portfolios !completed', portfolios && portfolios.length);
                if (!portfolioExists) {
                    completed = true;
                    done();
                }
            }

        });

        broker.exitPosition(demoOrder)
    })
})