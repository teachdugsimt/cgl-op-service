#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TieLambdaStack } from '../lib/tie-lambda-stack';
// import { TestLambdaStack } from '../lib/test-lambda-stack'

const app = new cdk.App();

const secret_key = "CGLDevDbInstance"

const envSgp = { region: 'ap-southeast-1' }
new TieLambdaStack(app, 'CglOpServiceLambdaStack', { env: envSgp, secretKey: secret_key });
// new TestLambdaStack(app, 'CglTestServiceLambdaStack', { env: envSgp, secretKey: secret_key });

