import 'mocha';
import { MilleBroker } from '.';

const milleBroker = new MilleBroker();

describe('Mille broker demo', () => {

    it(`Fake trade `, (done) => {
        milleBroker.sub("onTrade", async (data: any) => {
            console.log('data is', data);
            done();
        });
    })

})