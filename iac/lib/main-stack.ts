import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as glue from '@aws-cdk/aws-glue-alpha';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // MetabaseをホストするAppRunnerサービス
    new apprunner.Service(this, 'MetabaseService', {
      source: apprunner.Source.fromAsset({
        asset: new cdk.aws_ecr_assets.DockerImageAsset(
          this,
          'MetabaseDockerImage',
          {
            directory: './asset/business-intelligence',
            platform: cdk.aws_ecr_assets.Platform.LINUX_AMD64,
          }
        ),
        imageConfiguration: {
          port: 3000,
        },
      }),
    });

    // Metabaseで分析したいDynamoDBテーブル
    new cdk.aws_dynamodb.Table(this, 'UsersTable', {
      tableName: 'users',
      partitionKey: {
        name: 'id',
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const cartItemsTable = new cdk.aws_dynamodb.Table(this, 'CartItemsTable', {
      tableName: 'cartItems',
      partitionKey: {
        name: 'id',
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const accountId = cdk.Stack.of(this).account;

    const athenaSpillBucket = new cdk.aws_s3.Bucket(this, 'AthenaSpillBucket', {
      bucketName: `${accountId}-athena-spill`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Athena DynamoDB Connector
    // ref:
    // - [Is AthenaDynamoDBConnector available for CDK | AWS re:Post](https://repost.aws/questions/QUT7HV1WExS_S-zHlotN6O3A/is-athenadynamodbconnector-available-for-cdk)
    // - [AthenaDynamoDBConnector - AWS Serverless Application Repository](https://serverlessrepo.aws.amazon.com/applications/us-east-1/292517598671/AthenaDynamoDBConnector)
    const athenaDynamoDbConnectorApplicationAthenaCatalogName =
      'athena-dynamo-db-connector';
    new cdk.aws_sam.CfnApplication(this, 'AthenaDynamoDbConnectorApplication', {
      location: {
        applicationId:
          'arn:aws:serverlessrepo:us-east-1:292517598671:applications/AthenaDynamoDBConnector',
        semanticVersion: '2024.42.3',
      },
      parameters: {
        AthenaCatalogName: athenaDynamoDbConnectorApplicationAthenaCatalogName, // 次の正規表現にマッチする必要がある: /^[a-z0-9-_]{1,64}$/
        SpillBucket: athenaSpillBucket.bucketName,
      },
    });
    const athenaDynamoDbConnectorApplicationLambdaFn =
      cdk.aws_lambda.Function.fromFunctionName(
        this,
        'AthenaDynamoDbConnectorApplicationLambdaFn',
        athenaDynamoDbConnectorApplicationAthenaCatalogName
      );
    new cdk.aws_athena.CfnDataCatalog(this, 'DynamoDbDataSourceConnector', {
      name: 'DynamoDbDataSourceConnector',
      type: 'LAMBDA',
      parameters: {
        function: athenaDynamoDbConnectorApplicationLambdaFn.functionArn,
      },
    });

    // Athenaクエリ結果格納用バケット
    const athenaQueriesBucket = new cdk.aws_s3.Bucket(
      this,
      'AthenaQueriesBucket',
      {
        bucketName: `${accountId}-athena-queries`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Athenaワークグループ
    new cdk.aws_athena.CfnWorkGroup(this, 'AthenaWorkGroup', {
      name: 'AthenaWorkGroup',
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${athenaQueriesBucket.bucketName}`,
        },
      },
      recursiveDeleteOption: true,
    });

    // Glue DB
    const ddbConnectorGlueDb = new glue.Database(this, 'DdbConnectorGlueDb', {
      // Glue DB 名は英数字とアンダースコアのみ使用可能
      // Metabaseから接続できるのは'default'のみっぽい
      // Additional Athena connection string optionsを用いれば、'default'以外のDB名でも接続できそうではあるが、試してみたところできなかった
      // connection stringの設定方法が間違っていたのか、Metabaseのバグなのかは深掘りしていない
      // ref: https://www.metabase.com/docs/latest/databases/connections/athena#additional-athena-connection-string-options
      databaseName: 'default',
    });

    // Glue Crawler用のIAMロール
    const ddbTablesGlueCrawlerRole = new cdk.aws_iam.Role(
      this,
      'DdbTablesGlueCrawlerRole',
      {
        assumedBy: new cdk.aws_iam.ServicePrincipal('glue.amazonaws.com'),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSGlueServiceRole'
          ),
        ],
      }
    );
    ddbTablesGlueCrawlerRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: ['dynamodb:DescribeTable', 'dynamodb:Scan'],
        resources: [`${cartItemsTable.tableArn}*`],
      })
    );

    // Glue Crawler
    // Athena DynamoDB Connectorを用いて、テーブル名に英小文字を含むDynamoDBテーブルにクエリする場合、DDBテーブルに対応するGlueテーブルを作成する必要がある
    // Glueテーブル作成のためにGlue Crawlerを作成する
    // ref:
    // - [データベース、テーブル、列に名前を付ける - Amazon Athena](https://docs.aws.amazon.com/ja_jp/athena/latest/ug/tables-databases-columns-names.html#ate-table-database-and-column-names-allow-only-underscore-special-characters)
    // - [Amazon Athena DynamoDB コネクタ - Amazon Athena](https://docs.aws.amazon.com/ja_jp/athena/latest/ug/connectors-dynamodb.html)
    new cdk.aws_glue.CfnCrawler(this, 'DdbTablesGlueCrawler', {
      role: ddbTablesGlueCrawlerRole.roleArn,
      targets: {
        dynamoDbTargets: [
          {
            path: cartItemsTable.tableName,
          },
        ],
      },
      databaseName: ddbConnectorGlueDb.databaseName,
    });

    // MetabaseからAthenaに接続するために必要なバケット
    const metabaseAthenaConnectionStagingBucket = new cdk.aws_s3.Bucket(
      this,
      'MetabaseAthenaConnectionStagingBucket',
      {
        bucketName: `${accountId}-metabase-athena-connection-staging`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // MetabaseからAthenaに接続するために必要なIAMポリシー
    const metabaseAthenaConnectionPolicy = new cdk.aws_iam.ManagedPolicy(
      this,
      'MetabaseAthenaConnectionPolicy',
      {
        managedPolicyName: 'MetabaseAthenaConnectionPolicy',
        statements: [
          new cdk.aws_iam.PolicyStatement({
            sid: 'Athena',
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
              'athena:BatchGetNamedQuery',
              'athena:BatchGetQueryExecution',
              'athena:GetDataCatalog',
              'athena:GetNamedQuery',
              'athena:GetQueryExecution',
              'athena:GetQueryResults',
              'athena:GetQueryResultsStream',
              'athena:GetWorkGroup',
              'athena:ListDatabases',
              'athena:ListDataCatalogs',
              'athena:ListNamedQueries',
              'athena:ListQueryExecutions',
              'athena:ListTagsForResource',
              'athena:ListWorkGroups',
              'athena:ListTableMetadata',
              'athena:StartQueryExecution',
              'athena:StopQueryExecution',
              'athena:CreatePreparedStatement',
              'athena:DeletePreparedStatement',
              'athena:GetPreparedStatement',
            ],
            resources: ['*'],
          }),
          new cdk.aws_iam.PolicyStatement({
            sid: 'Glue',
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
              'glue:BatchGetPartition',
              'glue:GetDatabase',
              'glue:GetDatabases',
              'glue:GetPartition',
              'glue:GetPartitions',
              'glue:GetTable',
              'glue:GetTables',
              'glue:GetTableVersion',
              'glue:GetTableVersions',
            ],
            resources: ['*'],
          }),
          new cdk.aws_iam.PolicyStatement({
            sid: 'Lambda',
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: ['lambda:InvokeFunction'],
            resources: [athenaDynamoDbConnectorApplicationLambdaFn.functionArn],
          }),
          new cdk.aws_iam.PolicyStatement({
            sid: 'S3',
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
              's3:PutObject',
              's3:GetObject',
              's3:AbortMultipartUpload',
              's3:ListBucket',
              's3:GetBucketLocation',
            ],
            resources: [
              athenaQueriesBucket.bucketArn,
              athenaQueriesBucket.arnForObjects('*'),
              athenaSpillBucket.bucketArn,
              athenaSpillBucket.arnForObjects('*'),
              metabaseAthenaConnectionStagingBucket.bucketArn,
              metabaseAthenaConnectionStagingBucket.arnForObjects('*'),
            ],
          }),
        ],
      }
    );

    // MetabaseからAthenaに接続する際に利用するIAMユーザー
    new cdk.aws_iam.User(this, 'MetabaseAthenaConnectionUser', {
      userName: 'MetabaseAthenaConnectionUser',
      managedPolicies: [metabaseAthenaConnectionPolicy],
    });
  }
}
