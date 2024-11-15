import {
  AttributeDefinition,
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  GlobalSecondaryIndex,
  KeySchemaElement,
  ListTablesCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDBインスタンスを作成
 */
export const buildDdbClients = (): {
  ddb: DynamoDBClient;
  ddbDoc: DynamoDBDocumentClient;
} => {
  const ddb = new DynamoDBClient({
    endpoint: 'http://localhost:8000',
    region: 'us-west-2',
    credentials: {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey',
    },
  });
  const ddbDoc = DynamoDBDocumentClient.from(ddb);
  return { ddb, ddbDoc };
};

interface RefreshTableParams {
  ddb: DynamoDBClient;
  tableName: string;
  attributeDefinitions: AttributeDefinition[];
  keySchema: KeySchemaElement[];
  globalSecondaryIndexes?: GlobalSecondaryIndex[];
}

/**
 * テーブルを削除し再作成する
 *
 * @param params パラメータ
 * @param params.tableName 自動テスト並列実行時にテーブル名が被らないようにUUIDを推奨
 * @returns {void}
 */
export const refreshTable = async ({
  ddb,
  tableName,
  attributeDefinitions,
  keySchema,
  globalSecondaryIndexes,
}: RefreshTableParams): Promise<void> => {
  const { TableNames: tableNames } = await ddb.send(new ListTablesCommand({}));
  if ((tableNames ?? []).includes(tableName)) {
    await ddb.send(new DeleteTableCommand({ TableName: tableName }));
  }

  await ddb.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: attributeDefinitions,
      KeySchema: keySchema,
      LocalSecondaryIndexes: undefined,
      GlobalSecondaryIndexes: globalSecondaryIndexes,
      BillingMode: 'PAY_PER_REQUEST',
    })
  );
};
