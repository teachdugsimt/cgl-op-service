import * as cdk from '@aws-cdk/core';
import { LambdaLayerStack } from './lambda-layer-stack/lambda-layer-stack'
import { LambdaMessagingStack } from './lambda-messaging-stack/lambda-messaging-stack'
import { LambdaAuthorizerStack } from './lambda-authorizer-stack/lambda-authorizer-stack'
import { LambdaAuthenticationStack } from './lambda-authentication-stack/lambda-authentication-stack'
import { LambdaTruckServiceStack } from './lambda-truck-service-stack/lambda-truck-service-stack'
import { LambdaFileManagementStack } from './lambda-file-management-stack/lambda-file-management-stack'
// import { ApiGatewayStack } from './api-gateway-stack/api-gateway-stack'
import * as apigateway from '@aws-cdk/aws-apigateway';
import { LambdaLayerPackageApiStack } from './lambda-layer-package-api-stack/lambda-layer-stack'
import * as lambda from "@aws-cdk/aws-lambda";
import { PolicyStatement } from "@aws-cdk/aws-iam"

interface CdkStackProps extends cdk.StackProps {
  env?: { region?: string }
  secretKey: string
}

export class TestLambdaStack extends cdk.Stack {
  lambdaLayerResources: LambdaLayerStack
  lambdaMessagingResources: LambdaMessagingStack
  lambdaAuthorizerResources: LambdaAuthorizerStack
  lambdaAuthenticationResources: LambdaAuthenticationStack
  lambdaTruckServiceResources: LambdaTruckServiceStack
  lambdaFileManagementStack: LambdaFileManagementStack
  lambdaLayerPackageApiStack: LambdaLayerPackageApiStack
  layerPackageNpm: lambda.LayerVersion
  fileManagementLambdaFN: lambda.Function
  lambdaIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);


    // layer
    this.layerPackageNpm = new lambda.LayerVersion(this, 'package-without-connection-test', {
      code: lambda.Code.fromAsset('../package-npm/fastify-without-connection/'), // ** muse be pack root folder
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X, lambda.Runtime.NODEJS_14_X],
      license: 'Apache-2.0',
      description: 'The Lambda Layer with out db connection',
      layerVersionName: 'layer-with-none-typeorm'
    });

    const apigw = new apigateway.RestApi(this, 'CglOpAPI-test', {
      deploy: true,
      binaryMediaTypes: ['application/pdf', 'multipart/form-data']
    })






    const lambdaPolicy = new PolicyStatement({ actions: ["s3:*", "dynamodb:PutItem", "dynamodb:GetItem"] })
    lambdaPolicy.addAllResources()


    this.fileManagementLambdaFN = new lambda.Function(this, 'ID-lambda-test-exclude', {
      runtime: lambda.Runtime.NODEJS_12_X,
      layers: [this.layerPackageNpm],
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-file-management.zip', {
        // exclude: ['src/*', 'test/*', 'node_modules/*']
        // exclude: ['src/*', 'test/*']
        // , ignoreMode: cdk.IgnoreMode.GLOB
        // , followSymlinks: cdk.SymlinkFollowMode.NEVER
      }),
      initialPolicy: [lambdaPolicy],
      timeout: cdk.Duration.millis(30000),
      functionName: 'lambda-test-exclude',
    })

    this.lambdaIntegration = new apigateway.LambdaIntegration(this.fileManagementLambdaFN)
    const apiGatewayRestApi = apigw
    apiGatewayRestApi.root
      .resourceForPath('api/v1/media')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.lambdaIntegration)



  }

}
