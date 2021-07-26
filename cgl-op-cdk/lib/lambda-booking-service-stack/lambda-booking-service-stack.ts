import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as secretsManager from "@aws-cdk/aws-secretsmanager";

interface LambdaBookingServiceProps extends cdk.NestedStackProps {
  apigw: apigateway.RestApi
  authorizer: apigateway.RequestAuthorizer,
  secretKey: string
  layer?: lambda.LayerVersion
}

export class LambdaBookingServiceStack extends cdk.NestedStack {
  bookingLambdaFunc: lambda.Function
  bookingIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaBookingServiceProps) {
    super(scope, id, props);

    const lambdaPolicy = new PolicyStatement()
    lambdaPolicy.addActions("secretsmanager:*")
    lambdaPolicy.addAllResources()
    // lambda

    const dataSec = secretsManager.Secret.fromSecretNameV2(this, 'CGLDevDbInstanceKey', props.secretKey);
    const host: any = dataSec.secretValueFromJson('host').toString()
    const port: any = dataSec.secretValueFromJson('port').toString()
    const password: any = dataSec.secretValueFromJson('password').toString()
    const engine: any = dataSec.secretValueFromJson('engine').toString()
    const dbInstanceIdentifier: any = dataSec.secretValueFromJson('dbInstanceIdentifier').toString()
    const username: any = dataSec.secretValueFromJson('username').toString()

    this.bookingLambdaFunc = new lambda.Function(this, 'CglBookingServiceFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-booking', {
        exclude: ['src/*', 'test/*']
      }),
      timeout: cdk.Duration.millis(30000),
      initialPolicy: [lambdaPolicy],
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN
      },
      functionName: id,
      environment: {
        "TYPEORM_CONNECTION": engine,
        "TYPEORM_HOST": host,
        "TYPEORM_USERNAME": username,
        "TYPEORM_PASSWORD": password,
        "TYPEORM_DATABASE": "booking_service",
        "TYPEORM_PORT": port,
        "TYPEORM_NAME": dbInstanceIdentifier,
        "TYPEORM_SYNCHRONIZE": "false",
        "TYPEORM_LOGGING": "true",
        "TYPEORM_ENTITIES_DIR": "dist/models",
        "TYPEORM_ENTITIES": "dist/models/*.entity.js",
        "TYPEORM_MIGRATIONS": "dist/migrations/*.js",
        "TYPEORM_MIGRATIONS_RUN": "true",
        "TYPEORM_MIGRATIONS_DIR": "dist/migrations",
      }
    })

    this.bookingIntegration = new apigateway.LambdaIntegration(this.bookingLambdaFunc)
    const apiGatewayRestApi = props.apigw
    apiGatewayRestApi.root
      .resourceForPath('api/v1/booking')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.bookingIntegration, { authorizer: props.authorizer })

    apiGatewayRestApi.root
      .resourceForPath('api/v1/booking')
      .addMethod('POST', this.bookingIntegration)

  }
}

