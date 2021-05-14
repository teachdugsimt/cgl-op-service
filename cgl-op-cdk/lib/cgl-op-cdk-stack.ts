import * as cdk from '@aws-cdk/core';
import { TieLambdaStack } from './tie-lambda-stack'
import { ApiGatewayStack } from './api-gateway-stack/api-gateway-stack'
import { LambdaMessagingStack } from './lambda-messaging-stack/lambda-messaging-stack'
import { LambdaAuthorizerStack } from './lambda-authorizer-stack/lambda-authorizer-stack'
import { LambdaAuthenticationStack } from './lambda-authentication-stack/lambda-authentication-stack'

export class CglOpCdkStack extends cdk.Stack {
  // lambdaLayerResources: LambdaLayerStack
  // lambdaMessagingResources: LambdaMessagingStack
  // lambdaAuthorizerResources: LambdaAuthorizerStack
  lambdaAuthenticationResources: LambdaAuthenticationStack
  apiGatewayResources: ApiGatewayStack
  // allLambda: cdk.ConcreteDependable


  allLambdaStack: {
    lambdaMessagingResources: LambdaMessagingStack
    lambdaAuthorizerResources: LambdaAuthorizerStack
    lambdaAuthenticationResources: LambdaAuthenticationStack
  }
  // allLambdaStack: any

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.allLambdaStack = new TieLambdaStack(this, 'cgl-op-all-lambda')
    const { lambdaMessagingResources, lambdaAuthorizerResources, lambdaAuthenticationResources }
      = this.allLambdaStack

    const { messagingLambdaFunc } = lambdaMessagingResources
    const { authorizeFunc } = lambdaAuthorizerResources
    const { authLambdaFunc } = lambdaAuthenticationResources

    this.apiGatewayResources = new ApiGatewayStack(this, "legacy-api-gateway-resources", {
      authLambdaFunc,
      authorizeFunc,
      messagingLambdaFunc
    })

    
    // this.apiGatewayResources.addDependency(this.allLambdaStack)
    this.apiGatewayResources.addDependency(lambdaMessagingResources)
    this.apiGatewayResources.addDependency(lambdaAuthorizerResources)
    this.apiGatewayResources.addDependency(lambdaAuthenticationResources)

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
