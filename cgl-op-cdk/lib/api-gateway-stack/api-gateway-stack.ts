import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';


interface ApigatewayProps extends cdk.NestedStackProps {
  deploy?: boolean
}

export class ApiGatewayStack extends cdk.NestedStack {
  apigw: apigateway.RestApi

  constructor(scope: cdk.Construct, id: string, props?: ApigatewayProps) {
    super(scope, id, props);
    this.apigw = new apigateway.RestApi(this, id, { deploy: props?.deploy ?? true, binaryMediaTypes: ['application/octet-stream', "application/json"] })
  }
}






// import * as cdk from '@aws-cdk/core';
// import * as lambda from "@aws-cdk/aws-lambda";
// import * as apigateway from '@aws-cdk/aws-apigateway';

// export class CglOpCdkStack extends cdk.Stack {
//   constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     // layer
//     const layer = new lambda.LayerVersion(this, 'utility-layer', {
//       code: lambda.Code.fromAsset('../utility-layer'),
//       compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
//       license: 'Apache-2.0',
//       description: 'A layer that enables initial to run in AWS Lambda',
//     });

//     // lambda
//     const authLambdaFunc = new lambda.Function(this, 'AuthenticationFN', {
//       runtime: lambda.Runtime.NODEJS_12_X,
//       handler: 'lambda.handler',
//       code: lambda.Code.fromAsset('../cgl-op-authentication', {
//         exclude: ['src/*', 'test/*']
//       }),
//       layers: [layer]
//     })

//     const authorizeFunc = new lambda.Function(this, "LambdaAuthorizerFN", {
//       runtime: lambda.Runtime.NODEJS_12_X,
//       handler: 'lambda.handler',
//       code: lambda.Code.fromAsset("../cgl-op-lambda-authorizer/", {
//         exclude: ['src/*']
//       }),
//     });

//     const authorizer = new apigateway.RequestAuthorizer(this, 'CglAuthorizer', {
//       handler: authorizeFunc,
//       identitySources: [apigateway.IdentitySource.header('Authorization')],
//       resultsCacheTtl: cdk.Duration.minutes(0),
//     })

//     const apigw = new apigateway.RestApi(this, 'CglOpAPI', { deploy: true })
//     const authIntegration = new apigateway.LambdaIntegration(authLambdaFunc)

//     apigw.root
//       .resourceForPath('api/v1/auth')
//       .addProxy({
//         anyMethod: false
//       })
//       .addMethod('ANY', authIntegration, {
//         authorizer,
//       })
//   }
// }
