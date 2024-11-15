import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { region } from './constant';

export interface FetchSsmParameterStoresResult {
  stageName: string;
}

/**
 * SSMパラメータストアの値を取得
 *
 * @returns パラメータストアの値
 */
export const fetchSsmParameterStores =
  async (): Promise<FetchSsmParameterStoresResult> => {
    const ssm = new SSMClient({
      region,
    });

    const stageNameParameterStore = await ssm.send(
      new GetParameterCommand({
        Name: 'stageName',
      })
    );

    return {
      stageName: stageNameParameterStore.Parameter!.Value!,
    };
  };
