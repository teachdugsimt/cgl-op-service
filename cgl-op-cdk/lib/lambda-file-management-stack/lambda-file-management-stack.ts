import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as secretsManager from "@aws-cdk/aws-secretsmanager";

interface LambdaFileManagementProps extends cdk.NestedStackProps {
  apigw: apigateway.RestApi
}

export class LambdaFileManagementStack extends cdk.NestedStack {
  fileManagementLambdaFN: lambda.Function
  lambdaIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaFileManagementProps) {
    super(scope, id, props);
    // lambda

    const lambdaPolicy = new PolicyStatement()
    lambdaPolicy.addActions("s3:*")
    lambdaPolicy.addAllResources()

    this.fileManagementLambdaFN = new lambda.Function(this, 'CglFileManagementFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-file-management', {
        exclude: ['src/*', 'test/*']
      }),
      initialPolicy: [lambdaPolicy],
      timeout: cdk.Duration.millis(30000),
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN
      },
      functionName: id,
    })

    this.lambdaIntegration = new apigateway.LambdaIntegration(this.fileManagementLambdaFN)
    const apiGatewayRestApi = props.apigw
    apiGatewayRestApi.root
      .resourceForPath('api/v1/media')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.lambdaIntegration)

  }
}

