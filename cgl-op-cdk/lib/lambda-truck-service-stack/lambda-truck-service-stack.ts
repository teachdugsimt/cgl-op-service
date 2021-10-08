import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as secretsManager from "@aws-cdk/aws-secretsmanager";
import * as events from '@aws-cdk/aws-events'
import * as targets from "@aws-cdk/aws-events-targets"

interface LambdaTruckServiceProps extends cdk.NestedStackProps {
  apigw: apigateway.RestApi
  secretKey: string
  authorizer: apigateway.RequestAuthorizer,
  layer?: lambda.LayerVersion
}

export class LambdaTruckServiceStack extends cdk.NestedStack {
  messagingLambdaFunc: lambda.Function
  messagingIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaTruckServiceProps) {
    super(scope, id, props);

    const lambdaPolicy = new PolicyStatement({ actions: ["secretsmanager:*", "dynamodb:*", "s3:*"] })
    lambdaPolicy.addAllResources()
    // lambda

    const dataSec = secretsManager.Secret.fromSecretNameV2(this, 'CGLDevDbInstanceKey', props.secretKey);
    const host: any = dataSec.secretValueFromJson('host').toString()
    const port: any = dataSec.secretValueFromJson('port').toString()
    const password: any = dataSec.secretValueFromJson('password').toString()
    const engine: any = dataSec.secretValueFromJson('engine').toString()
    const dbInstanceIdentifier: any = dataSec.secretValueFromJson('dbInstanceIdentifier').toString()
    const username: any = dataSec.secretValueFromJson('username').toString()
    const truckPath = "api/v1/trucks"
    const apiUrl: any = process.env.API_URL ? `https://${process.env.API_URL}` : "https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod"
    const backofficeUrl = process.env.BACKOFFICE_URL

    this.messagingLambdaFunc = new lambda.Function(this, 'CglTruckServiceFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-truck-service', {
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
        "TYPEORM_DATABASE": "truck_service",
        "TYPEORM_PORT": port,
        "TYPEORM_NAME": dbInstanceIdentifier,
        "TYPEORM_SYNCHRONIZE": "false",
        "TYPEORM_LOGGING": "true",
        "TYPEORM_ENTITIES_DIR": "dist/models",
        "TYPEORM_ENTITIES": "dist/models/*.entity.js",
        "TYPEORM_MIGRATIONS": "dist/migrations/*.js",
        "TYPEORM_MIGRATIONS_RUN": "true",
        "TYPEORM_MIGRATIONS_DIR": "dist/migrations",
        "API_URL": apiUrl,
        "UPLOAD_LINK_DYNAMO": 'cgl_truck_upload_link',
        "BACK_OFFICE_URL": `https://${backofficeUrl}`,
        "USER_UPLOAD": "truck/upload/"
      }
    })

    this.messagingIntegration = new apigateway.LambdaIntegration(this.messagingLambdaFunc)
    const apiGatewayRestApi = props.apigw
    apiGatewayRestApi.root
      .resourceForPath(truckPath)
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.messagingIntegration, { authorizer: props.authorizer })

    apiGatewayRestApi.root
      .resourceForPath('api/v2/trucks')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.messagingIntegration, { authorizer: props.authorizer })

    apiGatewayRestApi.root
      .resourceForPath(truckPath)
      .addMethod('GET', this.messagingIntegration)

    apiGatewayRestApi.root
      .resourceForPath(truckPath)
      .addMethod('POST', this.messagingIntegration, { authorizer: props.authorizer })

    const meetingSyncEvent = {
      path: `/${truckPath}`,
      httpMethod: "GET"
    };

    const eventTarget = new targets.LambdaFunction(this.messagingLambdaFunc, {
      event: events.RuleTargetInput.fromObject(meetingSyncEvent)
    });

    const eventRule = new events.Rule(this, "CglTruckEventRule", {
      enabled: true,
      description: `Event to invoke GET /${truckPath}`,
      ruleName: "cgl-op-event-rule-trucks",
      targets: [
        eventTarget
      ],
      schedule: events.Schedule.rate(cdk.Duration.minutes(10))
    });
    // eventRule.addTarget(new targets.LambdaFunction(this.messagingLambdaFunc));
  }
}

