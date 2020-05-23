<h1 align="center">MILLE PAPER TRADING (AURUM)</h1>

<p align="center">
<a href="https://www.npmjs.com/package/@stoqey/aurum-broker-mille">
<img alt="NPM" src="https://img.shields.io/npm/dt/@stoqey/aurum-broker-mille.svg"></img>
</a>

</p>


<p align="center">
A broker implementation for aurum using <a href="https://github.com/stoqey/mille">Mille paper trading</a>
</p>

####  [Aurum broker API v0.0.7](https://github.com/stoqey/aurum-broker-spec)

## Broker methods

| Method            | Progress |
| ----------------- | -------- |
| init              | ✅        |
| getAccountSummary | ✅        |
| getOpenOrders     | ❌        |
| getAllPositions   | ❌        |
| enterPosition     | ❌        |
| exitPosition      | ❌        |
| searchSymbol      | ❌        |
| quoteSymbol       | ❌        |
| getMarketData     | ✅        |
| getPriceUpdate    | ✅        |

## Broker events
| Method        | Progress |
| ------------- | -------- |
| onReady       | ✅        |
| onPortfolios  | ❌        |
| onOrder       | ❌        |
| onMarketData  | ❌        |
| onPriceUpdate | ❌        |


### Installation
```bash
npm i @stoqey/aurum-broker-ibkr
```

### Usage

```ts
import { MilleBroker } from '@stoqey/aurum-broker-mille';

const broker = new MilleBroker();

// register events
broker.when('onReady', async () => {
    console.log('Mille broker is ready');

    // Get price updates
    broker.getPriceUpdate({ symbol: "AAPL" });
});

broker.when("onPriceUpdate", async ({ symbol, close, ...others }) => {
    console.log('on price updates data is', symbol);
});


// start the broker
broker.init();


```


## Other implementations
- [Interactive brokers](https://github.com/stoqey/aurum-broker-ibkr)


STOQEY INC