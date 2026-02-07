import { version } from '../package.json';
import { HOMEPAGE } from '@/const';
import { ConsoleTransport, LogLayer, LogLayerTransportParams } from 'loglayer';

export const LOGGER = new LogLayer({
  prefix: `[Energy Distribution Extended v${version}]`,
  transport: new ConsoleTransport({
    logger: console,
    messageFn: ({ logLevel, messages }: LogLayerTransportParams) => {
      return `[${new Date().toISOString()}] [${logLevel.toUpperCase()}] ${messages.join(' ')}`;
    }
  })
});

LOGGER.info(`is installed. Readme: ${HOMEPAGE}`);
