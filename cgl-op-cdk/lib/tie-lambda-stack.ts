import * as cdk from '@aws-cdk/core';
import { LambdaLayerStack } from './lambda-layer-stack/lambda-layer-stack'
import { LambdaMessagingStack } from './lambda-messaging-stack/lambda-messaging-stack'
import { LambdaAuthorizerStack } from './lambda-authorizer-stack/lambda-authorizer-stack'
import { LambdaAuthenticationStack } from './lambda-authentication-stack/lambda-authentication-stack'
import { LambdaTruckServiceStack } from './lambda-truck-service-stack/lambda-truck-service-stack'
import { ApiGatewayStack } from './api-gateway-stack/api-gateway-stack'
import { LambdaTestServiceStack } from './test-lambda-stack/lambda-test-service-stack'
import * as apigateway from '@aws-cdk/aws-apigateway';

export class TieLambdaStack extends cdk.Stack {
  lambdaLayerResources: LambdaLayerStack
  lambdaMessagingResources: LambdaMessagingStack
  lambdaAuthorizerResources: LambdaAuthorizerStack
  lambdaAuthenticationResources: LambdaAuthenticationStack
  lambdaTruckServiceResources: LambdaTruckServiceStack
  lambdaTestServiceResources: LambdaTestServiceStack
  // apiGatewayResources: ApiGatewayStack

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.lambdaLayerResources = new LambdaLayerStack(this, "legacy-lambda-layer-resources")
    const { layer } = this.lambdaLayerResources

    // const apigatewayProps = new ApiGatewayStack(this, 'CglOpAPI', { deploy: true })
    // const { apigw } = apigatewayProps
    const apigw = new apigateway.RestApi(this, 'CglOpAPI', { deploy: true })

    // this.lambdaAuthorizerResources = new LambdaAuthorizerStack(this, "legacy-lambda-authorizer-resources", { apigw })
    // const { authorizer } = this.lambdaAuthorizerResources

    // this.lambdaAuthenticationResources = new LambdaAuthenticationStack(this, "legacy-lambda-authentication-resources", { apigw, layer, authorizer })
    // this.lambdaMessagingResources = new LambdaMessagingStack(this, "legacy-lambda-messaging-resources", { apigw })
    this.lambdaTruckServiceResources = new LambdaTruckServiceStack(this, "legacy-lambda-truck-service-resources", { apigw })

    // this.lambdaTruckServiceResources.addDependency(apigw)
    // this.lambdaAuthenticationResources.addDependency(this.lambdaLayerResources)
  }

}
