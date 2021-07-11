#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TieLambdaStack } from '../lib/tie-lambda-stack';
// import { LambdaTestCloudFront } from '../lib/api-art-test/lambda-art-test-stack'

const app = new cdk.App();

const secret_key = "CGLDevDbInstance"
const secret_key_env = "CGLEnv"

const envSgp = { region: 'ap-southeast-1' }
new TieLambdaStack(app, 'CglOpServiceLambdaStack', { env: envSgp, secretKey: secret_key, secretKeyEnv: secret_key_env });
// new LambdaTestCloudFront(app, "TestMethodOptionsStack", { env: envSgp })


