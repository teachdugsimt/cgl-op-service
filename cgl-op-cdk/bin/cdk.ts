#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TieLambdaStack } from '../lib/tie-lambda-stack';
import { LambdaTruckServiceStackOnly } from '../lib/lambda-truck-service-stack/only-lambda-stack'

export const lambdaApiStackName = "CglOpServiceLambdaTruckServiceStack"
export const lambdaFunctionName = "legacy-lambda-truck-service-resources"

const app = new cdk.App();
const envSgp = { region: 'ap-southeast-1' }
new TieLambdaStack(app, 'CglOpServiceLambdaStack', { env: envSgp });
new LambdaTruckServiceStackOnly(app, lambdaApiStackName, { env: envSgp, functionName: lambdaFunctionName });
