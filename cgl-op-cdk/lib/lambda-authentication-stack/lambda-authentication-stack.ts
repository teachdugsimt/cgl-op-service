import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as secretsManager from "@aws-cdk/aws-secretsmanager";
import { spawn } from 'child_process';
const url = require('url');
interface LambdaLayerResourcesProps extends cdk.NestedStackProps {
  // layer: lambda.LayerVersion
  apigw: apigateway.RestApi
  // gwUrl: string
  authorizer: apigateway.RequestAuthorizer
  secretKey: string
}

export class LambdaAuthenticationStack extends cdk.NestedStack {
  authLambdaFunc: lambda.Function
  authIntegration: apigateway.LambdaIntegration

  constructor(scope: cdk.Construct, id: string, props: LambdaLayerResourcesProps) {
    super(scope, id, props);

    const lambdaPolicy = new PolicyStatement({ actions: ["secretsmanager:*", "dynamodb:*", "kms:*", "cognito-idp:*"] })
    lambdaPolicy.addAllResources()
    // lambda

    const dataSec = secretsManager.Secret.fromSecretNameV2(this, 'CGLDevDbInstanceKey', props.secretKey);
    const host: any = dataSec.secretValueFromJson('host').toString()
    const port: any = dataSec.secretValueFromJson('port').toString()
    const password: any = dataSec.secretValueFromJson('password').toString()
    const engine: any = dataSec.secretValueFromJson('engine').toString()
    const dbInstanceIdentifier: any = dataSec.secretValueFromJson('dbInstanceIdentifier').toString()
    const username: any = dataSec.secretValueFromJson('username').toString()

    const userPoolId = cdk.Fn.importValue('CognitoStack:UserPoolId')
    const userPoolClientId = cdk.Fn.importValue('CognitoStack:UserPoolClientId')
    const masterKeyId = cdk.Fn.importValue('KmsStack:CglUserKeyARN')
    const pinpointProjectId = cdk.Fn.importValue('PinPointStack:CglPinpointProjectID')
    const backofficeUrl = process.env.BACKOFFICE_URL

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
      memorySize: 512,
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
        "USER_RESET_PASS_TABLE": "cgl_user_reset_pass",
        "USER_POOL_ID": userPoolId,
        "CLIENT_ID": userPoolClientId,
        "MASTER_KEY_ID": masterKeyId,
        "PINPOINT_PROJECT_ID": pinpointProjectId,
        // "MESSAGING_URL": `${props.gwUrl}api/v1/messaging`,
        "UPLOAD_LINK_DYNAMO": "cgl_user_upload_link",
        // "API_URL": `${props.gwUrl}`,
        "BACK_OFFICE_URL": `https://${backofficeUrl}`,
        "USER_UPLOAD": "user/upload/"
      }
      // layers: [props.layer]
    })

    const ls = spawn("aws", ["cloudformation", "list-exports"]);
    ls.stdout.on("data", data => {
      const exports = JSON.parse(data.toString('utf-8'))

      const exportedList = exports.Exports.filter((e: any) => e.Name == 'ApiGatewayStack:APIGwCglOpAPIUrl')
      if (exportedList.length > 0) {
        const gwUrl = exportedList[0].Value
        // cdk.Fn.importValue('ApiGatewayStack:APIGwCglOpAPIUrl')
        console.log('GWURL', gwUrl)

        this.authLambdaFunc.addEnvironment('MESSAGING_URL', `${gwUrl}api/v1/messaging`)
        this.authLambdaFunc.addEnvironment('API_URL', `${gwUrl}`)
      }
    });

    ls.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });

    ls.on('error', (error) => {
      console.log(`error: ${error.message}`);
    });

    ls.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });




    const defaultCorsPreflightOptions = {
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: apigateway.Cors.ALL_METHODS,
      allowCredentials: true,
      allowHeaders: ["*"],
      maxAge: cdk.Duration.seconds(0)
    }
    const apiGatewayRestApi = props.apigw
    this.authIntegration = new apigateway.LambdaIntegration(this.authLambdaFunc)
    const u0 = apiGatewayRestApi.root.resourceForPath('api/v1/users')

    const p1 = u0.addProxy({ anyMethod: false })
    p1.addMethod('ANY', this.authIntegration, { authorizer: props.authorizer })

    u0.addMethod('GET', this.authIntegration, {
      authorizer: props.authorizer,
    })
    u0.addMethod('POST', this.authIntegration, {
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

