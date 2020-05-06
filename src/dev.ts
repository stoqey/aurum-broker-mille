import { MilleBroker } from '.';

const milleBroker = new MilleBroker();

milleBroker.when('onReady', async () => {
    console.log('on ready');
    milleBroker.getPriceUpdate("AAPL");
});

milleBroker.when("onPriceUpdate", async (data: any) => {
    console.log('on price updates data is', data);
});

