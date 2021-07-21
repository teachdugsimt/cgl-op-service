import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"

interface LambdaFileManagementProps extends cdk.NestedStackProps {
  apigw: apigateway.RestApi
  layer: lambda.LayerVersion
}

export class LambdaFileManagementStack extends cdk.NestedStack {
  fileManagementLambdaFN: lambda.Function
  lambdaIntegration: apigateway.LambdaIntegration
  lambdaIntegrationMediaDowload: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaFileManagementProps) {
    super(scope, id, props);
    // lambda

    const lambdaPolicy = new PolicyStatement({ actions: ["s3:*", "dynamodb:*"] })
    lambdaPolicy.addAllResources()

    this.fileManagementLambdaFN = new lambda.Function(this, 'CglFileManagementFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      // layers: [props.layer],
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-file-management', {
        exclude: ['src/*', 'test/*']
      }),
      initialPolicy: [lambdaPolicy],
      timeout: cdk.Duration.millis(30000),
      functionName: id,
      memorySize: 512,
      environment: {
        TABLE_ATTACH_CODE: "cgl_attach_code",
        BUCKET_DOCUMENT: process.env.S3_BUCKET_NAME || "cargolink-documents",
        S3_URL: `https://${process.env.S3_BUCKET_NAME || "cargolink-documents"}.s3.ap-southeast-1.amazonaws.com`
      }
    })
    this.fileManagementLambdaFN.node.addDependency(props.layer)

    this.lambdaIntegration = new apigateway.LambdaIntegration(this.fileManagementLambdaFN, {
      contentHandling: apigateway.ContentHandling.CONVERT_TO_BINARY
    })
    const apiGatewayRestApi = props.apigw
    const u0 = apiGatewayRestApi.root.resourceForPath('api/v1/media')
    const p1 = u0.addProxy({ anyMethod: false })

    p1.addMethod('ANY', this.lambdaIntegration, {
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          "image/png": apigateway.Model.EMPTY_MODEL
        },
        responseParameters: {
          'method.response.header.Content-Type': true,
        }
      }]
    })









    // this.lambdaIntegrationMediaDowload = new apigateway.LambdaIntegration(this.fileManagementLambdaFN, {
    //   integrationResponses: [{
    //     statusCode: '200',
    //     // contentHandling: apigateway.ContentHandling.CONVERT_TO_BINARY
    //     // responseParameters: {
    //     //   'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Content-Length,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
    //     //   'method.response.header.Access-Control-Allow-Origin': "'*'",
    //     //   'method.response.header.Access-Control-Allow-Credentials': "'false'",
    //     //   'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,ANY,PATCH'",
    //     // },
    //   }],
    // })

    // const methodResponses = [{
    //   statusCode: '200',
    //   // responseParameters: {
    //   //   'method.response.header.Access-Control-Allow-Headers': true,
    //   //   'method.response.header.Access-Control-Allow-Methods': true,
    //   //   'method.response.header.Access-Control-Allow-Credentials': true,
    //   //   'method.response.header.Access-Control-Allow-Origin': true,
    //   //   'method.response.header.Content-Type': true,
    //   //   'method.response.header.Content-Length': true,
    //   // },
    // }]
    // u0.addResource("/file-stream-four").addMethod('GET', this.lambdaIntegrationMediaDowload, { methodResponses })
    // u0.addResource("/file-stream-three").addMethod('GET', this.lambdaIntegrationMediaDowload, { methodResponses })
    // u0.addResource("/file-stream-two").addMethod('GET', this.lambdaIntegrationMediaDowload, { methodResponses })
    // u0.addResource("/file-stream").addMethod('GET', this.lambdaIntegrationMediaDowload, { methodResponses })


  }

}

