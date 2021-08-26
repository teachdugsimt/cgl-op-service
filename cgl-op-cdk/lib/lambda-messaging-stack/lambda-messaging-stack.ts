import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as secretsManager from "@aws-cdk/aws-secretsmanager";
import { PolicyStatement } from "@aws-cdk/aws-iam"
interface LambdaMessagingProps extends cdk.NestedStackProps {
  layer?: lambda.LayerVersion
  apigw: apigateway.RestApi
  secretKey: string
}

export class LambdaMessagingStack extends cdk.NestedStack {
  messagingLambdaFunc: lambda.Function
  messagingIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaMessagingProps) {
    super(scope, id, props);

    const pinpointProjectId = cdk.Fn.importValue('PinPointStack:CglPinpointProjectID')
    const dataSec = secretsManager.Secret.fromSecretNameV2(this, 'CGLDevDbInstanceKey', props.secretKey);
    const host: any = dataSec.secretValueFromJson('host').toString()
    const port: any = dataSec.secretValueFromJson('port').toString()
    const password: any = dataSec.secretValueFromJson('password').toString()
    const engine: any = dataSec.secretValueFromJson('engine').toString()
    const dbInstanceIdentifier: any = dataSec.secretValueFromJson('dbInstanceIdentifier').toString()
    const username: any = dataSec.secretValueFromJson('username').toString()

    const lambdaPolicy = new PolicyStatement({ actions: ["SNS:*", "pinpoint:*", "mobiletargeting:*"] })
    lambdaPolicy.addAllResources()
    // lambda
    this.messagingLambdaFunc = new lambda.Function(this, 'CglMessagingFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-messaging', {
        exclude: ['src/*', 'test/*']
      }),
      timeout: cdk.Duration.millis(30000),
      initialPolicy: [lambdaPolicy],
      functionName: id,
      environment: {
        "PINPOINT_PROJECT_ID": pinpointProjectId,
        "TYPEORM_CONNECTION": engine,
        "TYPEORM_HOST": host,
        "TYPEORM_USERNAME": username,
        "TYPEORM_PASSWORD": password,
        "TYPEORM_DATABASE": "messaging_service",
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
      // layers: [props.layer]
    })

    this.messagingIntegration = new apigateway.LambdaIntegration(this.messagingLambdaFunc)
    const apiGatewayRestApi = props.apigw
    // apiGatewayRestApi.root
    //   .resourceForPath('api/v1/send-sms')
    //   .addProxy({
    //     anyMethod: false
    //   })
    //   .addMethod('ANY', this.messagingIntegration)

    apiGatewayRestApi.root
      .resourceForPath('api/v1/messaging')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.messagingIntegration)

  }
}

