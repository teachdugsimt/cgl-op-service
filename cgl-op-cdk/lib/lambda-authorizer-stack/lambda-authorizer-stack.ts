import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';

interface ApiGatewayProps extends  cdk.NestedStackProps {
  apigw: apigateway.RestApi
}

export class LambdaAuthorizerStack extends cdk.NestedStack {
  authorizeFunc: lambda.Function
  authorizer: apigateway.RequestAuthorizer
  
  constructor(scope: cdk.Construct, id: string, props: ApiGatewayProps) {
    super(scope, id, props);

    this.authorizeFunc = new lambda.Function(this, "CglLambdaAuthorizerFN", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset("../cgl-op-lambda-authorizer/", {
        exclude: ['src/*']
      }),
    });

    this.authorizer = new apigateway.RequestAuthorizer(this, 'CglAuthorizer', {
      handler: this.authorizeFunc,
      identitySources: [apigateway.IdentitySource.header('Authorization')],
      resultsCacheTtl: cdk.Duration.minutes(0),
    })

  }
}
