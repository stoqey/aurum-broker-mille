import 'mocha';
import { expect } from 'chai';
import { State } from './state';

const state = State.Instance;

const demoItem = {
    id: 1
};

const demoPath = 'demodata';

describe('State', () => {

    it(`Save item`, (done) => {
        state.saveData(demoPath, demoItem).then(() => {
            done();
        })
    })

    it(`Get item`, () => {
        state.getData(demoPath).then((data) => {
            console.log('data', data)
            expect(data && data.id).to.be.equals(demoItem.id)
        })
    })

})