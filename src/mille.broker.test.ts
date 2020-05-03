import 'mocha';
import { MilleBroker } from '.';

const milleBroker = new MilleBroker();

before((done) => {
    milleBroker.sub('onReady', async () => {
        console.log('on ready');
        done();
    });
});

describe('Mille broker', () => {

    it(`Price updates`, (done) => {

        milleBroker.sub("onPriceUpdate", async (data: any) => {
            console.log('on price updates data is', data);
            done();
        });

        milleBroker.getPriceUpdate("AAPL");
    })

})