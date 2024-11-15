import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import fs from 'fs';
import { region } from './constant';

export type StageName = 'DEV' | 'STG' | 'PRD';

export interface AwsAccount {
  stageName: StageName;
  accountId: string;
}

export type AwsAccounts = ReadonlyArray<AwsAccount>;

/**
 * AWSアカウントID許可リスト
 *
 * @returns AWSアカウント
 */
const fetchAwsAccounts = (): AwsAccounts =>
  JSON.parse(fs.readFileSync('../aws-accounts.json').toString());

export interface CheckCurrentAwsAccountResult {
  currentAwsAccount: AwsAccount;
}

/**
 * 現在AssumeRole中かどうか
 */
export const isAssumedRole = async (): Promise<boolean> => {
  const sts = new STSClient({
    region,
  });

  try {
    // 現在のAWSアカウントID
    await sts.send(new GetCallerIdentityCommand({}));
    return true;
  } catch (e: unknown) {
    if (
      (e as Error).message === 'Could not load credentials from any providers'
    ) {
      return false;
    }
    throw new Error('予期せぬエラーです。', { cause: e });
  }
};

/**
 * 現在のAWSアカウントが許可リスト内かチェックする
 *
 * @returns 現在のAWSアカウント
 */
export const checkCurrentAwsAccount =
  async (): Promise<CheckCurrentAwsAccountResult> => {
    const sts = new STSClient({
      region,
    });

    // 現在のAWSアカウントID
    const getCallerIdentityResult = await sts.send(
      new GetCallerIdentityCommand({})
    );
    const awsAccountId = getCallerIdentityResult.Account;

    // 許可リスト以外のAWSアカウントIDの場合、エラーで落とす
    const awsAccounts = fetchAwsAccounts();
    if (
      !awsAccounts.map(({ accountId }) => accountId).includes(awsAccountId!)
    ) {
      throw new Error(
        `許可されたAWSアカウントではありません。accountId=${awsAccountId}`
      );
    }

    // 現在のAWSアカウント
    const currentAwsAccount = awsAccounts.find(
      ({ accountId }) => accountId === awsAccountId
    )!;

    return {
      currentAwsAccount,
    };
  };
