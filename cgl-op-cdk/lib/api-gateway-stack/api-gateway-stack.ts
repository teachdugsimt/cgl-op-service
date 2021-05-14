import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';

interface LambdaResourcesProps extends cdk.NestedStackProps {
  authorizeFunc: lambda.Function
  authLambdaFunc: lambda.Function
  messagingLambdaFunc: lambda.Function
}


export class ApiGatewayStack extends cdk.NestedStack {

  authorizer: apigateway.RequestAuthorizer
  apigw: apigateway.RestApi
  authIntegration: apigateway.LambdaIntegration
  messagingIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaResourcesProps) {
    super(scope, id, props);

    this.authorizer = new apigateway.RequestAuthorizer(this, 'CglAuthorizer', {
      handler: props.authorizeFunc,
      identitySources: [apigateway.IdentitySource.header('Authorization')],
      resultsCacheTtl: cdk.Duration.minutes(0),
    })

    this.apigw = new apigateway.RestApi(this, 'CglOpAPI', { deploy: true })
    this.authIntegration = new apigateway.LambdaIntegration(props.authLambdaFunc)
    this.messagingIntegration = new apigateway.LambdaIntegration(props.messagingLambdaFunc)

    this.apigw.root
      .resourceForPath('api/v1/auth')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.authIntegration, {
        authorizer: this.authorizer,
      })

    this.apigw.root
      .resourceForPath('api/v1/send-sms')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.messagingIntegration)
  }
}
