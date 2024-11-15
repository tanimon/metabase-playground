import { Container } from 'inversify';
import { unwrapEnv } from '../env-util';

export const LOG_LEVEL = 'DEBUG' as const;
export const STAGE_NAME = 'STAGE_NAME' as const;

export const registerEnvVars = (container: Container): void => {
  container
    .bind(LOG_LEVEL)
    .toDynamicValue(() => unwrapEnv('LOG_LEVEL'))
    .inSingletonScope();
  container
    .bind(STAGE_NAME)
    .toDynamicValue(() => unwrapEnv('STAGE_NAME'))
    .inSingletonScope();
};
