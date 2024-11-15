import { Container } from 'inversify';
import { registerEnvVars } from './env-var';
import { registerSupports } from './support';

/**
 * DIコンテナに値を登録し、そのDIコンテナを返す
 *
 * @returns DIコンテナ
 */
export const registerContainer = (): Container => {
  const container = new Container();

  registerEnvVars(container);
  registerSupports(container);

  return container;
};
