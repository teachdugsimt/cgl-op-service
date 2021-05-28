import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';

interface LambdaLayerResourcesProps extends cdk.NestedStackProps {
  layer: lambda.LayerVersion
  apigw: apigateway.RestApi
  authorizer: apigateway.RequestAuthorizer
}

export class LambdaAuthenticationStack extends cdk.NestedStack {
  authLambdaFunc: lambda.Function
  authIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaLayerResourcesProps) {
    super(scope, id, props);

    // lambda
    this.authLambdaFunc = new lambda.Function(this, 'CglAuthenticationFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-user-service', {
        exclude: ['src/*', 'test/*']
      }),
      layers: [props.layer]
    })

    const apiGatewayRestApi = props.apigw
    this.authIntegration = new apigateway.LambdaIntegration(this.authLambdaFunc)
    apiGatewayRestApi.root
      .resourceForPath('api/v1/auth')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.authIntegration, {
        authorizer: props.authorizer,
      })

  }
}

