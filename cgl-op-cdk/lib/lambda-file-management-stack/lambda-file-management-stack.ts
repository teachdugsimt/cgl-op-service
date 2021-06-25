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
      environment: {
        TABLE_ATTACH_CODE: "cgl_attach_code"
      }
    })
    this.fileManagementLambdaFN.node.addDependency(props.layer)

    this.lambdaIntegration = new apigateway.LambdaIntegration(this.fileManagementLambdaFN)
    const apiGatewayRestApi = props.apigw
    const u0 = apiGatewayRestApi.root.resourceForPath('api/v1/media')
    const p1 = u0.addProxy({ anyMethod: false })
    p1.addMethod('ANY', this.lambdaIntegration)
    // this.addCorsOptions(p1)

    // u0.addProxy({
    //   anyMethod: false
    // })
    //   .addMethod('ANY', this.lambdaIntegration)


  }


  addCorsOptions(apiResource: apigateway.IResource) {
    apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Credentials': "'false'",
          'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,ANY,PATCH'",
        },
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": "{\"statusCode\": 200}"
      },
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }]
    })
  }
  
}

