import { checkCurrentAwsAccount } from '@classmethod/aws-util';
import { registerContainer } from '@/di-container/register-container';
import { LOGGER } from '@/di-container/register-container/support';
import { Logger } from '@/domain/support/logger';
import { initEnvVars } from '../cli-util';

export const helloWorldTask = async (): Promise<void> => {
  const { currentAwsAccount } = await checkCurrentAwsAccount();

  if (currentAwsAccount.stageName === 'PRD') {
    throw new Error('PRD環境では実行できません');
  }

  initEnvVars(currentAwsAccount.stageName);

  const container = registerContainer();
  const logger = container.get<Logger>(LOGGER);

  logger.debug({ message: 'hello' });
};
