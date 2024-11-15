import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { StageName } from '@classmethod/aws-util';
import { config } from 'dotenv';
import chunk from 'lodash.chunk';
import { chunkArray } from '@/util/array-util';
import { Logger } from '@/domain/support/logger';

/**
 * AWS本番環境かどうか
 */
export const isStagePrd = (stageName: StageName) => stageName === 'PRD';

/**
 * 環境変数の初期化
 */
export const initEnvVars = (stageName: StageName) => {
  config({
    path: '.env.cli',
  });
  process.env.STAGE_NAME = stageName;
};

// テーブルクリアする
export const deleteAllItems = async ({
  ddbDoc,
  tableName,
  partitionKey,
  sortKey,
}: {
  ddbDoc: DynamoDBDocumentClient;
  tableName: string;
  partitionKey: string;
  sortKey?: string;
}): Promise<void> => {
  let hasNext = true;
  while (hasNext) {
    // 全アイテムを取得
    // eslint-disable-next-line no-await-in-loop
    const { Items: items = [] } = await ddbDoc.send(
      new ScanCommand({
        TableName: tableName,
      })
    );
    const chunkedItems = chunk(items, 25);

    // 全アイテムを削除
    // eslint-disable-next-line no-restricted-syntax
    for (const oneItems of chunkedItems) {
      // eslint-disable-next-line no-await-in-loop
      await ddbDoc.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: oneItems.map((item) => ({
              DeleteRequest: {
                Key: {
                  ...(sortKey != null ? { [sortKey]: item[sortKey] } : {}),
                  [partitionKey]: item[partitionKey],
                },
              },
            })),
          },
        })
      );
    }

    hasNext = items.length > 0;
  }
};

/**
 * BatchWriteでテーブルにデータを保存する
 */
export const saveAllItems = async ({
  ddbDocClient,
  tableName,
  items,
  logger,
}: {
  ddbDocClient: DynamoDBDocumentClient;
  tableName: string;
  items: ReadonlyArray<Record<string, any>>;
  logger: Logger;
}) => {
  const itemsCount = items.length;
  const itemsCountPerBatch = 25;
  const chunkedItems = chunkArray(items, itemsCountPerBatch);
  let counter = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const itemsChunk of chunkedItems) {
    // eslint-disable-next-line no-await-in-loop
    await ddbDocClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: itemsChunk.map((item) => ({
            PutRequest: {
              Item: item,
            },
          })),
        },
      })
    );
  }

  counter += itemsCountPerBatch;
  if (counter % 10000 === 0) {
    // 進捗を見るため、1万件ごとにログ出力する
    logger.debug({ message: `${counter}/${itemsCount}` });
  }
};
