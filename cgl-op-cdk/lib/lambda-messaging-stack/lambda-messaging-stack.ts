import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
interface LambdaMessagingProps extends cdk.NestedStackProps {
  layer?: lambda.LayerVersion
  apigw: apigateway.RestApi
}

export class LambdaMessagingStack extends cdk.NestedStack {
  messagingLambdaFunc: lambda.Function
  messagingIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaMessagingProps) {
    super(scope, id, props);

    const lambdaPolicy = new PolicyStatement({ actions: ["SNS:*", "pinpoint:*", "mobiletargeting:*"] })
    lambdaPolicy.addAllResources()
    // lambda
    this.messagingLambdaFunc = new lambda.Function(this, 'CglMessagingFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-messaging', {
        exclude: ['src/*', 'test/*']
      }),
      timeout: cdk.Duration.millis(30000),
      initialPolicy: [lambdaPolicy],
      functionName: id,
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN
      },
      // layers: [props.layer]
    })

    const version = this.messagingLambdaFunc.currentVersion
    const alias = new lambda.Alias(this, 'alias-lambda-messaging-development', {
      aliasName: 'development',
      version: version
    });

    this.messagingIntegration = new apigateway.LambdaIntegration(this.messagingLambdaFunc)
    const apiGatewayRestApi = props.apigw
    apiGatewayRestApi.root
      .resourceForPath('api/v1/send-sms')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.messagingIntegration)

    apiGatewayRestApi.root
      .resourceForPath('api/v1/messaging')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.messagingIntegration)

  }
}

