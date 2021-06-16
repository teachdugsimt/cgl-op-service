import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as secretsManager from "@aws-cdk/aws-secretsmanager";
interface LambdaLayerResourcesProps extends cdk.NestedStackProps {
  // layer: lambda.LayerVersion
  apigw: apigateway.RestApi
  authorizer: apigateway.RequestAuthorizer
  secretKey: string
}

export class LambdaAuthenticationStack extends cdk.NestedStack {
  authLambdaFunc: lambda.Function
  authIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaLayerResourcesProps) {
    super(scope, id, props);

    const lambdaPolicy = new PolicyStatement({ actions: ["secretsmanager:*", "dynamodb:*", "cognito:*"] })
    lambdaPolicy.addAllResources()
    // lambda

    const dataSec = secretsManager.Secret.fromSecretNameV2(this, 'CGLDevDbInstanceKey', props.secretKey);
    const host: any = dataSec.secretValueFromJson('host').toString()
    const port: any = dataSec.secretValueFromJson('port').toString()
    const password: any = dataSec.secretValueFromJson('password').toString()
    const engine: any = dataSec.secretValueFromJson('engine').toString()
    const dbInstanceIdentifier: any = dataSec.secretValueFromJson('dbInstanceIdentifier').toString()
    const username: any = dataSec.secretValueFromJson('username').toString()

    // lambda
    this.authLambdaFunc = new lambda.Function(this, 'CglUserServiceFN', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../cgl-op-user-service', {
        exclude: ['src/*', 'test/*']
      }),
      initialPolicy: [lambdaPolicy],
      functionName: id,
      timeout: cdk.Duration.millis(30000),
      environment: {
        "TYPEORM_CONNECTION": engine,
        "TYPEORM_HOST": host,
        "TYPEORM_USERNAME": username,
        "TYPEORM_PASSWORD": password,
        "TYPEORM_DATABASE": "user_service",
        "TYPEORM_PORT": port,
        "TYPEORM_NAME": dbInstanceIdentifier,
        "TYPEORM_SYNCHRONIZE": "false",
        "TYPEORM_LOGGING": "true",
        "TYPEORM_ENTITIES_DIR": "dist/models",
        "TYPEORM_ENTITIES": "dist/models/*.entity.js",
        "TYPEORM_MIGRATIONS": "dist/migrations/*.js",
        "TYPEORM_MIGRATIONS_RUN": "true",
        "TYPEORM_MIGRATIONS_DIR": "dist/migrations",
        "OTP_TABLE": 'cgl_otp',
        "USER_TABLE": 'cgl_user',
        "USER_POOL_ID": 'ap-southeast-1_hIWBSYz7z',
        "CLIENT_ID": '4qkd14u6na0fo1tfhtrdari41i',
        "MASTER_KEY_ID": 'd0c2e90d-21f9-46bd-aa24-33e17f5d1b32',
        "PINPOINT_PROJECT_ID": '6218ffc1d1a9404b91858993b3cafed6',
        "MESSAGING_URL": 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod/api/v1/messaging',
        "UPLOAD_LINK_DYNAMO": "cgl_user_upload_link",
        "API_GW_ID": "2kgrbiwfnc", "API_URL": ".execute-api.ap-southeast-1.amazonaws.com"
      }
      // layers: [props.layer]
    })

    const apiGatewayRestApi = props.apigw
    this.authIntegration = new apigateway.LambdaIntegration(this.authLambdaFunc)
    apiGatewayRestApi.root
      .resourceForPath('api/v1/users')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.authIntegration, {
        authorizer: props.authorizer,
      })

    apiGatewayRestApi.root
      .resourceForPath('api/v1/auth')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.authIntegration)

    apiGatewayRestApi.root
      .resourceForPath('api/v1/password')
      .addProxy({
        anyMethod: false
      })
      .addMethod('ANY', this.authIntegration)

  }
}

