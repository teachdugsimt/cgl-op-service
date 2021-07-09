import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as secretsManager from "@aws-cdk/aws-secretsmanager";

interface LambdaMasterDataProps extends cdk.NestedStackProps {
  apigw: apigateway.RestApi
  secretKey: string
  layer?: lambda.LayerVersion
}

export class LambdaMasterDataStack extends cdk.NestedStack {
  masterDataLambdaFunc: lambda.Function
  masterDataIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaMasterDataProps) {
    super(scope, id, props);

    const lambdaPolicy = new PolicyStatement()
    lambdaPolicy.addActions("secretsmanager:*")
    lambdaPolicy.addAllResources()
    // lambda

    const dataSec = secretsManager.Secret.fromSecretNameV2(this, 'CGLDevDbInstanceKey', props.secretKey);
    const host: any = dataSec.secretValueFromJson('host').toString()
    const port: any = dataSec.secretValueFromJson('port').toString()
    const password: any = dataSec.secretValueFromJson('password').toString()
    const engine: any = dataSec.secretValueFromJson('engine').toString()
    const dbInstanceIdentifier: any = dataSec.secretValueFromJson('dbInstanceIdentifier').toString()
    const username: any = dataSec.secretValueFromJson('username').toString()

    this.masterDataLambdaFunc = new lambda.Function(this, 'CglMasterDataFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-master-data-service', {
        exclude: ['src/*', 'test/*']
      }),
      timeout: cdk.Duration.millis(30000),
      initialPolicy: [lambdaPolicy],
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN
      },
      functionName: id,
      environment: {
        "TYPEORM_CONNECTION": engine,
        "TYPEORM_HOST": host,
        "TYPEORM_USERNAME": username,
        "TYPEORM_PASSWORD": password,
        "TYPEORM_DATABASE": "master_data_service",
        "TYPEORM_PORT": port,
        "TYPEORM_NAME": dbInstanceIdentifier,
        "TYPEORM_SYNCHRONIZE": "false",
        "TYPEORM_LOGGING": "true",
        "TYPEORM_ENTITIES_DIR": "dist/models",
        "TYPEORM_ENTITIES": "dist/models/*.entity.js",
        "TYPEORM_MIGRATIONS": "dist/migrations/*.js",
        "TYPEORM_MIGRATIONS_RUN": "true",
        "TYPEORM_MIGRATIONS_DIR": "dist/migrations",
      }
    })

    this.masterDataIntegration = new apigateway.LambdaIntegration(this.masterDataLambdaFunc)
    const apiGatewayRestApi = props.apigw

    apiGatewayRestApi.root
      .resourceForPath('api/v1/master-data')
      .addProxy({ anyMethod: false })
      .addMethod('ANY', this.masterDataIntegration)

    // const u0 = apiGatewayRestApi.root.resourceForPath('api/v1/history')
    // const p1 = u0.addProxy({ anyMethod: false })
    // p1.addMethod('ANY', this.masterDataIntegration)
  }
}

