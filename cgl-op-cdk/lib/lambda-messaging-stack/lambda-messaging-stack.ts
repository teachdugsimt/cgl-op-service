import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';

interface LambdaMessagingProps extends cdk.NestedStackProps {
  layer?: lambda.LayerVersion
  apigw: apigateway.RestApi
}

export class LambdaMessagingStack extends cdk.NestedStack {
  messagingLambdaFunc: lambda.Function
  messagingIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaMessagingProps) {
    super(scope, id, props);

    // lambda
    this.messagingLambdaFunc = new lambda.Function(this, 'CglMessagingFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-messaging', {
        exclude: ['src/*', 'test/*']
      }),
      // layers: [props.layer]
    })

    this.messagingIntegration = new apigateway.LambdaIntegration(this.messagingLambdaFunc)
    const apiGatewayRestApi = props.apigw
    apiGatewayRestApi.root
      .resourceForPath('api/v1/send-sms')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.messagingIntegration)

  }
}

