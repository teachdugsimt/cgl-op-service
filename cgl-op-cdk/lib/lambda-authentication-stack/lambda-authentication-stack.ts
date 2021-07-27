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
        "UPLOAD_LINK_DYNAMO": "cgl_user_upload_link",
        "USER_UPLOAD": "user/upload/",
        "USER_POOL_ID": userPoolId,
        "CLIENT_ID": userPoolClientId,
        "MASTER_KEY_ID": masterKeyId,
        "PINPOINT_PROJECT_ID": pinpointProjectId,

        // "USER_POOL_ID": 'ap-southeast-1_hIWBSYz7z',
        // "CLIENT_ID": '4qkd14u6na0fo1tfhtrdari41i',
        // "MASTER_KEY_ID": 'arn:aws:kms:ap-southeast-1:029707422715:key/d0c2e90d-21f9-46bd-aa24-33e17f5d1b32',
        // "PINPOINT_PROJECT_ID": '6218ffc1d1a9404b91858993b3cafed6',
        // "MESSAGING_URL": `${props.gwUrl}api/v1/messaging`,  // can't => circular denpendency
        // "API_URL": `${props.gwUrl}`, // can't => circular denpendency
        "BACK_OFFICE_URL": `https://${backofficeUrl}`,
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

        this.authLambdaFunc.addEnvironment('MESSAGING_URL', `${gwUrl}/api/v1/messaging`)
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

