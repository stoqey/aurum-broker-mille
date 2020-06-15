import { MilleBroker } from '.';

const startDate = new Date("2020-03-10 09:30:00");
const milleBroker = new MilleBroker(startDate, { write: true, resume: true });

milleBroker.when('onReady', async () => {
    console.log('on ready');
    milleBroker.getPriceUpdate({ symbol: "AAPL", startDate });
});

milleBroker.when("onPriceUpdate", async (data: any) => {
    console.log('on price updates data is', data);
});

milleBroker.init();

