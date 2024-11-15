import { Container } from 'inversify';
import { LoggerImpl, LogLevel } from '@/infrastructure/logger';
import { LOG_LEVEL } from './env-var';

export const LOGGER = 'LOGGER' as const;

export const registerSupports = (container: Container): void => {
  container
    .bind(LOGGER)
    .toDynamicValue(
      (ctx) =>
        new LoggerImpl({ logLevel: ctx.container.get<LogLevel>(LOG_LEVEL) })
    )
    .inSingletonScope();
};
