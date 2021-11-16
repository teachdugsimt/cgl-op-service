import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as secretsManager from "@aws-cdk/aws-secretsmanager";
import * as events from '@aws-cdk/aws-events'
import * as targets from "@aws-cdk/aws-events-targets"

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
    const apiUrl: any = process.env.API_URL ? `https://${process.env.API_URL}` : "https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod"

    this.bookingLambdaFunc = new lambda.Function(this, 'CglBookingServiceFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-booking', {
        exclude: ['src/*', 'test/*']
      }),
      timeout: cdk.Duration.millis(30000),
      initialPolicy: [lambdaPolicy],
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
        "API_URL": apiUrl,
        "PAYMENT_DB": "payment_service"
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



    const meetingSyncEvent = {
      path: `/api/v1/booking/transportation`,
      httpMethod: "GET"
    };

    const eventTarget = new targets.LambdaFunction(this.bookingLambdaFunc, {
      event: events.RuleTargetInput.fromObject(meetingSyncEvent)
    });

    const eventRule = new events.Rule(this, "CglTransportationEventRule", {
      enabled: true,
      description: `Event to invoke GET /api/v1/booking`,
      ruleName: "cgl-op-event-rule-booking-service",
      targets: [
        eventTarget
      ],
      schedule: events.Schedule.rate(cdk.Duration.minutes(10))
    });
  }
}

