import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
interface LambdaJobManagementProps extends cdk.NestedStackProps {
  layer?: lambda.LayerVersion
  apigw: apigateway.RestApi
}

export class LambdaJobManagementStack extends cdk.NestedStack {
  jobManagementLambdaFunc: lambda.Function
  jobManagementIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaJobManagementProps) {
    super(scope, id, props);

    // const lambdaPolicy = new PolicyStatement({ actions: ["SNS:*", "pinpoint:*", "mobiletargeting:*"] })
    // lambdaPolicy.addAllResources()
    // lambda
    this.jobManagementLambdaFunc = new lambda.Function(this, 'CglJobManagementFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-job-service', {
        exclude: ['src/*', 'test/*']
      }),
      timeout: cdk.Duration.millis(30000),
      // initialPolicy: [lambdaPolicy],
      functionName: id,
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN
      },
      // layers: [props.layer]
    })

    this.jobManagementIntegration = new apigateway.LambdaIntegration(this.jobManagementLambdaFunc)
    const apiGatewayRestApi = props.apigw
    apiGatewayRestApi.root
      .resourceForPath('api/v1/jobs')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.jobManagementIntegration)

  }
}

