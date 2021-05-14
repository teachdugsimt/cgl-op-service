import * as cdk from '@aws-cdk/core';
import { LambdaLayerStack } from './lambda-layer-stack/lambda-layer-stack'
import { LambdaMessagingStack } from './lambda-messaging-stack/lambda-messaging-stack'
import { LambdaAuthorizerStack } from './lambda-authorizer-stack/lambda-authorizer-stack'
import { LambdaAuthenticationStack } from './lambda-authentication-stack/lambda-authentication-stack'
// import { ApiGatewayStack } from './api-gateway-stack/api-gateway-stack'
import * as apigateway from '@aws-cdk/aws-apigateway';

export class TieLambdaStack extends cdk.Stack {
  lambdaLayerResources: LambdaLayerStack
  lambdaMessagingResources: LambdaMessagingStack
  lambdaAuthorizerResources: LambdaAuthorizerStack
  lambdaAuthenticationResources: LambdaAuthenticationStack
  // apiGatewayResources: ApiGatewayStack

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.lambdaLayerResources = new LambdaLayerStack(this, "legacy-lambda-layer-resources")
    const { layer } = this.lambdaLayerResources

    const apigw = new apigateway.RestApi(this, 'CglOpAPI', { deploy: true })

    this.lambdaAuthorizerResources = new LambdaAuthorizerStack(this, "legacy-lambda-authorizer-resources", { apigw })
    const { authorizer } = this.lambdaAuthorizerResources

    this.lambdaAuthenticationResources = new LambdaAuthenticationStack(this, "legacy-lambda-authentication-resources", { apigw, layer, authorizer })
    this.lambdaMessagingResources = new LambdaMessagingStack(this, "legacy-lambda-messaging-resources", { apigw })

    this.lambdaAuthenticationResources.addDependency(this.lambdaLayerResources)

    // this.mappingApiGatewayStack(this.lambdaMessagingResources, this.lambdaAuthorizerResources, this.lambdaAuthenticationResources)
  }


  // private mappingApiGatewayStack(lambdaMessagingResources: LambdaMessagingStack,
  //   lambdaAuthorizerResources: LambdaAuthorizerStack, lambdaAuthenticationResources: LambdaAuthenticationStack) {
  //   const { messagingLambdaFunc } = lambdaMessagingResources
  //   const { authorizeFunc } = lambdaAuthorizerResources
  //   const { authLambdaFunc } = lambdaAuthenticationResources
  //   this.apiGatewayResources = new ApiGatewayStack(this, "legacy-api-gateway-resources", {
  //     authLambdaFunc,
  //     authorizeFunc,
  //     messagingLambdaFunc
  //   })

  //   this.apiGatewayResources.addDependency(lambdaMessagingResources)
  //   this.apiGatewayResources.addDependency(lambdaAuthorizerResources)
  //   this.apiGatewayResources.addDependency(lambdaAuthenticationResources)
  // }

}
