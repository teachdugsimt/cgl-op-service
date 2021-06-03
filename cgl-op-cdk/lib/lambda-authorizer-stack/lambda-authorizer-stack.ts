import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as secretsManager from "@aws-cdk/aws-secretsmanager";
interface ApiGatewayProps extends  cdk.NestedStackProps {
  apigw: apigateway.RestApi
  secretKey: string
}

export class LambdaAuthorizerStack extends cdk.NestedStack {
  authorizeFunc: lambda.Function
  authorizer: apigateway.RequestAuthorizer
  
  constructor(scope: cdk.Construct, id: string, props: ApiGatewayProps) {
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

    this.authorizeFunc = new lambda.Function(this, "CglLambdaAuthorizerFN", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'dist/lambda-authorizer.handler',
      code: lambda.Code.fromAsset("../cgl-op-lambda-authorizer-service/", {
        exclude: ['src/*']
      }),
      environment: {
        "TYPEORM_CONNECTION": engine,
        "TYPEORM_HOST": host,
        "TYPEORM_USERNAME": username,
        "TYPEORM_PASSWORD": password,
        "TYPEORM_DATABASE": "user_management",
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
    });

    this.authorizer = new apigateway.RequestAuthorizer(this, 'CglAuthorizer', {
      handler: this.authorizeFunc,
      identitySources: [apigateway.IdentitySource.header('Authorization')],
      resultsCacheTtl: cdk.Duration.minutes(0),
    })

  }
}
