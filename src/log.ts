import debug from 'debug';

const libraryPrefix = 'aurum-broker-mille';

/**
 * Use to log in general case
 */
export const log = debug(`${libraryPrefix}:info`);

/**
 * Use for verbose log
 */
export const verbose = debug(`${libraryPrefix}:verbose`);