/* eslint-disable class-methods-use-this */
/* eslint-disable no-console */
import { Logger, Outputted } from '@/domain/support/logger';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export const logLevels: Record<LogLevel, number> = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

export class LoggerImpl implements Logger {
  private readonly logLevel: LogLevel;

  constructor({ logLevel }: { logLevel?: LogLevel }) {
    this.logLevel = logLevel ?? 'DEBUG';
  }

  debug(obj: object): Outputted {
    if (logLevels[this.logLevel] <= logLevels.DEBUG) {
      console.debug(JSON.stringify({ ...obj, logLevel: 'DEBUG' }));
      return true;
    }

    return false;
  }

  info(obj: object): Outputted {
    if (logLevels[this.logLevel] <= logLevels.INFO) {
      console.info(JSON.stringify({ ...obj, logLevel: 'INFO' }));
      return true;
    }

    return false;
  }

  warn(obj: object): Outputted {
    if (logLevels[this.logLevel] <= logLevels.WARN) {
      console.warn(JSON.stringify({ ...obj, logLevel: 'WARN' }));
      return true;
    }

    return false;
  }

  error(obj: object): Outputted {
    if (logLevels[this.logLevel] <= logLevels.ERROR) {
      console.error(JSON.stringify({ ...obj, logLevel: 'ERROR' }));
      return true;
    }

    return false;
  }
}
