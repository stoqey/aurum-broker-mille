import express from 'express';
import os from 'os';
import { log, verbose } from './log';
import MilleBroker from './MilleBroker';

interface Args {
    app: express.Application;
    broker: MilleBroker;
}

const HOSTNAME = os.hostname();

/**
 * Simulated Mille Broker Server
 * @param args 
 * @param   app: express.Application; 
 * @param   broker: MilleBroker;
 */
export const milleBrokerServer = (args: Args): express.Application => {

    const { app, broker } = args;

    // Health check endpoint
    app.get('/', async (req, res) => {
        verbose('/health')
        res.json({ time: new Date(), hostname: os.hostname() })
    });

    app.post('/order/enter', async (req, res) => {
        broker.enterPosition(req.body);
        log('/order/enter', req.body && req.body.symbol)
        res.json({ time: new Date(), HOSTNAME, status: 200 });
    });

    app.post('/order/exit', async (req, res) => {
        broker.exitPosition(req.body);
        log('/order/exit', req.body && req.body.symbol)
        res.json({ time: new Date(), HOSTNAME, status: 200 });
    });

    return app;
}