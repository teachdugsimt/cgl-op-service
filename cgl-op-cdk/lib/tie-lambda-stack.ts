import * as cdk from '@aws-cdk/core';
import { LambdaLayerStack } from './lambda-layer-stack/lambda-layer-stack'
import { LambdaMessagingStack } from './lambda-messaging-stack/lambda-messaging-stack'
import { LambdaAuthorizerStack } from './lambda-authorizer-stack/lambda-authorizer-stack'
import { LambdaAuthenticationStack } from './lambda-authentication-stack/lambda-authentication-stack'
import { LambdaTruckServiceStack } from './lambda-truck-service-stack/lambda-truck-service-stack'
import { LambdaFileManagementStack } from './lambda-file-management-stack/lambda-file-management-stack'
// import { ApiGatewayStack } from './api-gateway-stack/api-gateway-stack'
import * as apigateway from '@aws-cdk/aws-apigateway';

interface CdkStackProps extends cdk.StackProps {
  env?: { region?: string }
  secretKey: string
}

export class TieLambdaStack extends cdk.Stack {
  lambdaLayerResources: LambdaLayerStack
  lambdaMessagingResources: LambdaMessagingStack
  lambdaAuthorizerResources: LambdaAuthorizerStack
  lambdaAuthenticationResources: LambdaAuthenticationStack
  lambdaTruckServiceResources: LambdaTruckServiceStack
  lambdaFileManagementStack: LambdaFileManagementStack
  // apiGatewayResources: ApiGatewayStack

  constructor(scope: cdk.Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    // this.lambdaLayerResources = new LambdaLayerStack(this, "lambda-layer-resources")
    // const { layer } = this.lambdaLayerResources

    const apigw = new apigateway.RestApi(this, 'CglOpAPI', {
      deploy: true,
      binaryMediaTypes: ['application/pdf', 'multipart/form-data']
    })

    this.lambdaAuthorizerResources = new LambdaAuthorizerStack(this, "lambda-authorizer-resources", {})
    const { authorizer } = this.lambdaAuthorizerResources

    this.lambdaAuthenticationResources = new LambdaAuthenticationStack(this, "lambda-user-service-resources", { apigw, authorizer })
    this.lambdaMessagingResources = new LambdaMessagingStack(this, "lambda-messaging-resources", { apigw })
    this.lambdaTruckServiceResources = new LambdaTruckServiceStack(this, "lambda-truck-service-resources", { apigw, secretKey: props.secretKey })
    this.lambdaFileManagementStack = new LambdaFileManagementStack(this, "lambda-file-management-resources", { apigw })

    apigw.node.addDependency(this.lambdaFileManagementStack)
    apigw.node.addDependency(this.lambdaTruckServiceResources)
    // this.lambdaTruckServiceResources.addDependency(apigw)
    // this.lambdaAuthenticationResources.addDependency(this.lambdaLayerResources)
  }

}
