import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"

interface LambdaTruckServiceProps extends cdk.NestedStackProps {
  apigw: apigateway.RestApi
  layer?: lambda.LayerVersion
}

export class LambdaTruckServiceStack extends cdk.NestedStack {
  messagingLambdaFunc: lambda.Function
  messagingIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaTruckServiceProps) {
    super(scope, id, props);

    const lambdaPolicy = new PolicyStatement()
    lambdaPolicy.addActions("secretsmanager:*")
    lambdaPolicy.addAllResources()
    // lambda
    this.messagingLambdaFunc = new lambda.Function(this, 'CglTruckServiceFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-truck-service', {
        exclude: ['src/*', 'test/*']
      }),
      timeout: cdk.Duration.millis(30000),
      initialPolicy: [lambdaPolicy],
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN
      },
      functionName: id,
      environment: {
        "TYPEORM_CONNECTION": "postgres",
        "TYPEORM_HOST": "cgl-dev-db.chbn9ns43yos.ap-southeast-1.rds.amazonaws.com",
        "TYPEORM_USERNAME": "postgres",
        "TYPEORM_PASSWORD": "=5BjfT_-uaa98yYymACI2415a==LA,",
        "TYPEORM_DATABASE": "postgres",
        "TYPEORM_PORT": "5432",
        "TYPEORM_SYNCHRONIZE": "false",
        "TYPEORM_LOGGING": "true",
        "TYPEORM_ENTITIES_DIR": "dist/models",
        "TYPEORM_ENTITIES": "dist/models/*.entity.js",
        "TYPEORM_MIGRATIONS": "dist/migrations/*.js",
        "TYPEORM_MIGRATIONS_RUN": "true",
        "TYPEORM_MIGRATIONS_DIR": "dist/migrations",
      }
    })

    const version = this.messagingLambdaFunc.currentVersion
    const alias = new lambda.Alias(this, 'alias-lambda-truck-development', {
      aliasName: 'development',
      version: version
    });

    this.messagingIntegration = new apigateway.LambdaIntegration(this.messagingLambdaFunc)
    const apiGatewayRestApi = props.apigw
    apiGatewayRestApi.root
      .resourceForPath('api/v1/truck')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.messagingIntegration)

  }
}

