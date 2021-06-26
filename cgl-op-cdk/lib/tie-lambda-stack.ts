import * as cdk from '@aws-cdk/core';
import { LambdaLayerStack } from './lambda-layer-stack/lambda-layer-stack'
import { LambdaMessagingStack } from './lambda-messaging-stack/lambda-messaging-stack'
import { LambdaAuthorizerStack } from './lambda-authorizer-stack/lambda-authorizer-stack'
import { LambdaAuthenticationStack } from './lambda-authentication-stack/lambda-authentication-stack'
import { LambdaTruckServiceStack } from './lambda-truck-service-stack/lambda-truck-service-stack'
import { LambdaFileManagementStack } from './lambda-file-management-stack/lambda-file-management-stack'
import { LambdaJobServiceStack } from './lambda-job-service-stack/lambda-jobs-service-stack'

import * as apigateway from '@aws-cdk/aws-apigateway';
import { LambdaLayerPackageApiStack } from './lambda-layer-package-api-stack/lambda-layer-stack'
import * as acm from "@aws-cdk/aws-certificatemanager";

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
  lambdaLayerPackageApiStack: LambdaLayerPackageApiStack
  lambdaJobServiceStack: LambdaJobServiceStack
  // apiGatewayResources: ApiGatewayStack

  constructor(scope: cdk.Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    this.lambdaLayerResources = new LambdaLayerStack(this, "lambda-layer-resources")
    const { layer } = this.lambdaLayerResources

    this.lambdaLayerPackageApiStack = new LambdaLayerPackageApiStack(this, "lambda-layer-package-api-resources")
    const { layerPackageNpm } = this.lambdaLayerPackageApiStack

    const apigw = new apigateway.RestApi(this, 'CglOpAPI', {

      // domainName: {
      //   domainName: `api.cargolink.co.th`,
      //   certificate: acm.Certificate.fromCertificateArn(
      //     this,
      //     "CglCertificate",
      //     "arn:aws:acm:ap-southeast-1:029707422715:certificate/1d6aab07-16bb-4775-b3c7-60a013427dbd"
      //   ),
      //   endpointType: apigateway.EndpointType.REGIONAL
      // },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowCredentials: true,
        allowHeaders: ["*"],
        // maxAge: cdk.Duration.seconds(0),
        disableCache: true
      },
      deploy: true,
      binaryMediaTypes: ['application/pdf', 'multipart/form-data']
    })

    this.lambdaAuthorizerResources = new LambdaAuthorizerStack(this, "lambda-authorizer-resources", { secretKey: props.secretKey })
    const { authorizer } = this.lambdaAuthorizerResources

    this.lambdaAuthenticationResources = new LambdaAuthenticationStack(this, "lambda-user-service-resources", { apigw, authorizer, secretKey: props.secretKey })
    this.lambdaMessagingResources = new LambdaMessagingStack(this, "lambda-messaging-resources", { apigw })
    this.lambdaTruckServiceResources = new LambdaTruckServiceStack(this, "lambda-truck-service-resources", { apigw, secretKey: props.secretKey })
    this.lambdaFileManagementStack = new LambdaFileManagementStack(this, "lambda-file-management-resources", { apigw, layer: layerPackageNpm })
    this.lambdaJobServiceStack = new LambdaJobServiceStack(this, "lambda-job-service-resources", { apigw, secretKey: props.secretKey, layer: layerPackageNpm })

    apigw.node.addDependency(this.lambdaFileManagementStack)
    apigw.node.addDependency(this.lambdaTruckServiceResources)

    this.lambdaFileManagementStack.addDependency(this.lambdaLayerPackageApiStack)



    // this.lambdaTruckServiceResources.addDependency(apigw)
    // this.lambdaAuthenticationResources.addDependency(this.lambdaLayerResources)
  }

}
