import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as secretsManager from "@aws-cdk/aws-secretsmanager";

export class LambdaTestCloudFront extends cdk.Stack {
  messagingLambdaFunc: lambda.Function
  messagingIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const lambdaPolicy = new PolicyStatement()
    lambdaPolicy.addActions("secretsmanager:*")
    lambdaPolicy.addAllResources()
    // lambda

    // const dataSec = secretsManager.Secret.fromSecretNameV2(this, 'CGLDevDbInstanceKey', props.secretKey);
    // const host: any = dataSec.secretValueFromJson('host').toString()
    // const port: any = dataSec.secretValueFromJson('port').toString()
    // const password: any = dataSec.secretValueFromJson('password').toString()
    // const engine: any = dataSec.secretValueFromJson('engine').toString()
    // const dbInstanceIdentifier: any = dataSec.secretValueFromJson('dbInstanceIdentifier').toString()
    // const username: any = dataSec.secretValueFromJson('username').toString()

    this.messagingLambdaFunc = new lambda.Function(this, 'CglArtTestServiceFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-test-simple-api', {
        exclude: ['src/*', 'test/*']
      }),
      timeout: cdk.Duration.millis(30000),
      initialPolicy: [lambdaPolicy],
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN
      },
      functionName: "lambda-art-test-options",
      environment: {
        // "TYPEORM_CONNECTION": engine,
        // "TYPEORM_HOST": host,
        // "TYPEORM_USERNAME": username,
        // "TYPEORM_PASSWORD": password,
        // "TYPEORM_DATABASE": "cargolink",
        // "TYPEORM_PORT": port,
        // "TYPEORM_NAME": dbInstanceIdentifier,
        "TYPEORM_SYNCHRONIZE": "false",
        "TYPEORM_LOGGING": "true",
        "TYPEORM_ENTITIES_DIR": "dist/models",
        "TYPEORM_ENTITIES": "dist/models/*.entity.js",
        "TYPEORM_MIGRATIONS": "dist/migrations/*.js",
        "TYPEORM_MIGRATIONS_RUN": "true",
        "TYPEORM_MIGRATIONS_DIR": "dist/migrations",
      }
    })

    const apigw = new apigateway.RestApi(this, 'ArtTestAPI', {
      // domainName: {
      //   domainName: `api.cargolink.co.th`,
      //   certificate: acm.Certificate.fromCertificateArn(
      //     this,
      //     "CglCertificate",
      //     "arn:aws:acm:ap-southeast-1:029707422715:certificate/1d6aab07-16bb-4775-b3c7-60a013427dbd"
      //   ),
      //   endpointType: apigateway.EndpointType.REGIONAL
      // },
      deploy: true,
      binaryMediaTypes: ['application/pdf', 'multipart/form-data']
    })

    this.messagingIntegration = new apigateway.LambdaIntegration(this.messagingLambdaFunc)
    const apiGatewayRestApi = apigw

    const t1 = apiGatewayRestApi.root.resourceForPath('api/v1/arttest')
    t1.addProxy({
      anyMethod: false
    })
      .addMethod('ANY', this.messagingIntegration)
    this.addCorsOptions(t1)
  }

  addCorsOptions(apiResource: apigateway.IResource) {
    apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Credentials': "'false'",
          'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,ANY'",
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
