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

import * as apigateway from '@aws-cdk/aws-apigateway';
import { LambdaLayerPackageApiStack } from './lambda-layer-package-api-stack/lambda-layer-stack'
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as iam from "@aws-cdk/aws-iam"

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
  lambdaMasterDataStack: LambdaMasterDataStack
  lambdaHistoryServiceStack: LambdaHistoryServiceStack
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
        // allowCredentials: true,
        allowHeaders: ["*"],
        // maxAge: cdk.Duration.seconds(0),
        disableCache: true
      },
      deploy: true,
      // binaryMediaTypes: ['*/*']
      binaryMediaTypes: ['application/pdf', 'multipart/form-data', 'image/png', 'image/jpeg', 'image/jpg', 'application/octet-stream']
    })









    // const myRole = iam.Role.fromRoleArn(this, "AdminRole", 'arn:aws:iam::029707422715:role/apigateway-directly-get-file-s3')
    // const s3Integration = new apigateway.AwsIntegration({
    //   service: 's3',
    //   integrationHttpMethod: "GET",
    //   // path: "cargolink-documents",
    //   // action: 'GetObject',
    //   // actionParameters: {
    //   //   Bucket: 'cargolink-documents',
    //   //   Key: 'file'
    //   // },
    //   path: "cargolink-documents/{file}",
    //   options: {
    //     credentialsRole: myRole,
    //     requestParameters: {
    //       // 'integration.request.path.bucket': 'method.request.path.bucket',
    //       // 'integration.request.path.folder': 'method.request.path.folder',
    //       'integration.request.path.file': 'method.request.path.file',
    //     },
    //     integrationResponses: [{ statusCode: "200" }]
    //   }
    // })

    // apigw.root.addResource("{file}").addMethod("GET", s3Integration, {
    //   methodResponses: [{ statusCode: "200" }],
    //   requestParameters: {
    //     // 'method.request.path.bucket': true,
    //     // 'method.request.path.folder': true,
    //     'method.request.path.file': true,
    //   }
    // });











    this.lambdaAuthorizerResources = new LambdaAuthorizerStack(this, "lambda-authorizer-resources", { secretKey: props.secretKey })
    const { authorizer } = this.lambdaAuthorizerResources

    this.lambdaAuthenticationResources = new LambdaAuthenticationStack(this, "lambda-user-service-resources", { apigw, authorizer, secretKey: props.secretKey })
    this.lambdaMessagingResources = new LambdaMessagingStack(this, "lambda-messaging-resources", { apigw })
    this.lambdaTruckServiceResources = new LambdaTruckServiceStack(this, "lambda-truck-service-resources", { apigw, authorizer, secretKey: props.secretKey })
    this.lambdaFileManagementStack = new LambdaFileManagementStack(this, "lambda-file-management-resources", { apigw, layer: layerPackageNpm })
    this.lambdaJobServiceStack = new LambdaJobServiceStack(this, "lambda-job-service-resources", { apigw, secretKey: props.secretKey, layer: layerPackageNpm })
    this.lambdaMasterDataStack = new LambdaMasterDataStack(this, "lambda-master-data-resources", { apigw, secretKey: props.secretKey, layer: layerPackageNpm })
    this.lambdaHistoryServiceStack = new LambdaHistoryServiceStack(this, "lambda-history-resources", { apigw, authorizer, secretKey: props.secretKey, layer: layerPackageNpm })

    apigw.node.addDependency(this.lambdaFileManagementStack)
    apigw.node.addDependency(this.lambdaTruckServiceResources)

    this.lambdaFileManagementStack.addDependency(this.lambdaLayerPackageApiStack)



    // this.lambdaTruckServiceResources.addDependency(apigw)
    // this.lambdaAuthenticationResources.addDependency(this.lambdaLayerResources)
  }

}
