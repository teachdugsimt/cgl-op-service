#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TieLambdaStack } from '../lib/tie-lambda-stack';

const app = new cdk.App();

const secret_key = process.env.RDS_INSTANCE_NAME || "CGLDevDbInstance"
const secret_key_env = "CGLEnv"

const envSgp = { region: 'ap-southeast-1' }
new TieLambdaStack(app, 'CglOpServiceLambdaStack', { env: envSgp, secretKey: secret_key, secretKeyEnv: secret_key_env });


