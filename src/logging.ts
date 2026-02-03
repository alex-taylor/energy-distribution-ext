/* eslint-disable no-console */
import { version } from '../package.json';
import { HOMEPAGE } from '@/const';

// Log Version
console.groupCollapsed(`%c⚡ Energy Flow Card Extended v${version} is installed`, 'color: #488fc2; font-weight: bold');
console.log('Readme:', HOMEPAGE);
console.groupEnd();

export const logError = (error: string) => {
  console.error(
    `%c⚡ Energy Flow Card Extended v${version} %cError: ${error}`,
    'font-weight: bold',
    'color: #b33a3a; font-weight: normal'
  );
};

export const logDebug = (message: string) => {
  console.debug(
    `%c⚡ Energy Flow Card Extended v${version} %c${message}`,
    'font-weight: bold',
    'font-weight: normal'
  );
};
