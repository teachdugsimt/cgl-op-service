import * as cdk from '@aws-cdk/core';
import { LambdaLayerStack } from './lambda-layer-stack/lambda-layer-stack'
import { LambdaMessagingStack } from './lambda-messaging-stack/lambda-messaging-stack'
import { LambdaAuthorizerStack } from './lambda-authorizer-stack/lambda-authorizer-stack'
import { LambdaAuthenticationStack } from './lambda-authentication-stack/lambda-authentication-stack'
import { LambdaTruckServiceStack } from './lambda-truck-service-stack/lambda-truck-service-stack'
import { LambdaFileManagementStack } from './lambda-file-management-stack/lambda-file-management-stack'
import { LambdaJobServiceStack } from './lambda-job-service-stack/lambda-jobs-service-stack'
import { LambdaMasterDataStack } from './lambda-master-data-stack/lambda-master-data-stack'
import { LambdaHistoryServiceStack } from './lambda-history-service-stack/lambda-history-service'
import { LambdaPricingServiceStack } from "./lambda-pricing-service-stack/lambda-pricing-service-stack";
import { LambdaServiceServiceStack } from "./lambda-service-service-stack/lambda-service-service-stack";
import { LambdaBookingServiceStack } from './lambda-booking-service-stack/lambda-booking-service-stack'
import { LambdaTripServiceStack } from './lambda-trip-service-stack/lambda-trip-service-stack'
import { CargolinkDocumentStack } from './lambda-event-dynamo-s3/lambda-event-dynamo-s3'

import * as apigateway from '@aws-cdk/aws-apigateway';
import { LambdaLayerPackageApiStack } from './lambda-layer-package-api-stack/lambda-layer-stack'

interface CdkStackProps extends cdk.StackProps {
  env?: { region?: string }
  secretKey: string,
  secretKeyEnv: string
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
  lambdaMasterDataStack: LambdaMasterDataStack
  lambdaHistoryServiceStack: LambdaHistoryServiceStack
  lambdaPricingServiceStack: LambdaPricingServiceStack
  lambdaServiceServiceStack: LambdaServiceServiceStack
  lambdaBookingServiceStack: LambdaBookingServiceStack
  lambdaTripServiceStack: LambdaTripServiceStack
  cargolinkDocumentStack: CargolinkDocumentStack
  // apiGatewayResources: ApiGatewayStack

  constructor(scope: cdk.Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    this.lambdaLayerResources = new LambdaLayerStack(this, "lambda-layer-resources")
    const { layer } = this.lambdaLayerResources

    this.lambdaLayerPackageApiStack = new LambdaLayerPackageApiStack(this, "lambda-layer-package-api-resources")
    const { layerPackageNpm } = this.lambdaLayerPackageApiStack

    const apigw = new apigateway.RestApi(this, 'CglOpAPI', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        // allowCredentials: true,
        allowHeaders: ["*"],
        // maxAge: cdk.Duration.seconds(0),
        disableCache: true
      },
      deploy: true,
      binaryMediaTypes: ['application/pdf', 'application/octet-stream', 'image/*', 'multipart/form-data']
    })

    new cdk.CfnOutput(this, "CglOpApiUrl", {
      value: apigw.url.replace(/\/$/, ""),
      exportName: "ApiGatewayStack:APIGwCglOpAPIUrl"
    });

    this.lambdaAuthorizerResources = new LambdaAuthorizerStack(this, "lambda-authorizer-resources", { secretKey: props.secretKey })
    const { authorizer } = this.lambdaAuthorizerResources

    // let gwUrl = cdk.Fn.importValue('ApiGatewayStack:APIGwCglOpAPIUrl')
    this.lambdaAuthenticationResources = new LambdaAuthenticationStack(this, "lambda-user-service-resources", { apigw, authorizer, secretKey: props.secretKey })

    this.lambdaMessagingResources = new LambdaMessagingStack(this, "lambda-messaging-resources", { apigw, secretKey: props.secretKey })
    this.lambdaTruckServiceResources = new LambdaTruckServiceStack(this, "lambda-truck-service-resources", { apigw, authorizer, secretKey: props.secretKey })
    this.lambdaFileManagementStack = new LambdaFileManagementStack(this, "lambda-file-management-resources", { apigw, layer: layerPackageNpm })
    this.lambdaJobServiceStack = new LambdaJobServiceStack(this, "lambda-job-service-resources", { apigw, secretKey: props.secretKey, layer: layerPackageNpm })
    this.lambdaMasterDataStack = new LambdaMasterDataStack(this, "lambda-master-data-resources", { apigw, secretKey: props.secretKey, layer: layerPackageNpm })
    this.lambdaHistoryServiceStack = new LambdaHistoryServiceStack(this, "lambda-history-resources", { apigw, authorizer, secretKey: props.secretKey, layer: layerPackageNpm })
    this.lambdaPricingServiceStack = new LambdaPricingServiceStack(this, "lambda-pricing-resources", { apigw, secretKey: props.secretKey, layer: layerPackageNpm })
    this.lambdaServiceServiceStack = new LambdaServiceServiceStack(this, "lambda-service-resources", { apigw, secretKey: props.secretKey, layer: layerPackageNpm })
    this.lambdaBookingServiceStack = new LambdaBookingServiceStack(this, "lambda-booking-resources", { apigw, authorizer, secretKey: props.secretKey, layer: layerPackageNpm })
    this.lambdaTripServiceStack = new LambdaTripServiceStack(this, "lambda-trip-resources", { apigw, authorizer, secretKey: props.secretKey, layer: layerPackageNpm })

    this.cargolinkDocumentStack = new CargolinkDocumentStack(this, "cargolink-document-event", {})

    apigw.node.addDependency(this.lambdaFileManagementStack)
    apigw.node.addDependency(this.lambdaTruckServiceResources)

    this.lambdaFileManagementStack.addDependency(this.lambdaLayerPackageApiStack)

    // this.lambdaTruckServiceResources.addDependency(apigw)
    // this.lambdaAuthenticationResources.addDependency(this.lambdaLayerResources)

  }

}
