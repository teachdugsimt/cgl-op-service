// import * as cdk from '@aws-cdk/core';
// import * as lambda from "@aws-cdk/aws-lambda";
// import * as apigateway from '@aws-cdk/aws-apigateway';
// import { PolicyStatement } from "@aws-cdk/aws-iam"

// interface LambdaApiStackProps extends cdk.StackProps {
//   functionName: string
// }

// export class LambdaTruckServiceStackOnly extends cdk.Stack {
//   messagingLambdaFunc: lambda.Function
//   messagingIntegration: apigateway.LambdaIntegration

//   constructor(scope: cdk.Construct, id: string, props: LambdaApiStackProps) {
//     super(scope, id, props);

//     const lambdaPolicy = new PolicyStatement()
//     lambdaPolicy.addActions("secretsmanager:*")
//     lambdaPolicy.addAllResources()

//     // lambda
//     this.messagingLambdaFunc = new lambda.Function(this, 'CglTruckServiceFUNCTION', {
//       runtime: lambda.Runtime.NODEJS_12_X,
//       handler: 'lambda.handler',
//       code: lambda.Code.fromAsset('../cgl-op-truck-service', {
//         exclude: ['src/*', 'test/*']
//       }),
//       timeout: cdk.Duration.millis(30000),
//       // layers: [props.layer]
//       initialPolicy: [lambdaPolicy],
//       functionName: props.functionName
//     })

//     // this.messagingIntegration = new apigateway.LambdaIntegration(this.messagingLambdaFunc)

//     // const apiGatewayRestApi = apigateway.RestApi.fromRestApiAttributes(this, 'RestApi', {
//     //   restApiId: 'acwn6beop9',
//     //   rootResourceId: 'CglOpAPI'
//     // });
//     // console.log("apiGatewayRestApi :: ", apiGatewayRestApi)
//     // apiGatewayRestApi.root
//     //   .resourceForPath('api/v1/truck')
//     //   .addProxy({
//     //     anyMethod: false
//     //   })
//     //   .addMethod('ANY', this.messagingIntegration)


//     // const deployment: any = new apigateway.Deployment(this, 'APIGatewayDeployment', {
//     //   api: apiGatewayRestApi,
//     // });

//     // deployment.resource.stageName = 'https://acwn6beop9.execute-api.ap-southeast-1.amazonaws.com/prod';
//   }
// }










import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as codedeploy from '@aws-cdk/aws-codedeploy';

interface LambdaApiStackProps extends cdk.StackProps {
  functionName: string
}

export class LambdaTruckServiceStackOnly extends cdk.Stack {
  messagingLambdaFunc: lambda.Function
  messagingIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaApiStackProps) {
    super(scope, id, props);

    const lambdaPolicy = new PolicyStatement()
    lambdaPolicy.addActions("secretsmanager:*")
    lambdaPolicy.addAllResources()

    // lambda

    const lambdaFnProps: lambda.FunctionProps = {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-truck-service', {
        exclude: ['src/*', 'test/*']
      }),
      timeout: cdk.Duration.millis(30000),
      initialPolicy: [lambdaPolicy],
      functionName: props.functionName,
      description: id + "-" + new Date().toISOString(),
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN
      },
    };

    this.messagingLambdaFunc = new lambda.Function(this, 'CglTruckServiceFN', lambdaFnProps)


    // const stagingVersion = lambda.Version.fromVersionArn(this, 'truckStagingVersion', `${this.messagingLambdaFunc.functionArn}:1`);
    // stagingVersion.addAlias('staging');
    // const currentVersion = this.messagingLambdaFunc.currentVersion;
    // new lambda.Alias(this, 'alias-lambda-truck-development', {
    //   aliasName: 'development',
    //   version: currentVersion
    // });


    const version = this.messagingLambdaFunc.currentVersion
    const alias = new lambda.Alias(this, 'alias-lambda-truck-development', {
      aliasName: 'development',
      version: version
    });

    // new codedeploy.LambdaDeploymentGroup(this, "LambdaDeploymentGroup", {
    //   alias: alias,
    //   deploymentConfig: codedeploy.LambdaDeploymentConfig.ALL_AT_ONCE,
    // });
  }
}



