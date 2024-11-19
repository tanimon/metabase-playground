import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
  }
}
