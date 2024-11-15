export class NotFoundEnvVarError extends Error {
  constructor(envName: string) {
    super(`環境変数${envName}が見つかりませんでした。`);
    this.name = 'NotFoundEnvVarError';
  }
}

/**
 * 環境変数の有無をチェックし、存在する場合は値を返す
 * 存在しない場合はエラーを投げる
 *
 * @param {string} envName 環境変数名
 * @returns {string} 環境変数の値
 */
export const unwrapEnv = (envName: string): string => {
  const envValue = process.env[envName];
  if (envValue == null) {
    throw new NotFoundEnvVarError(envName);
  }
  return envValue;
};
