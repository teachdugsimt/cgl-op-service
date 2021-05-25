#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TieLambdaStack } from '../lib/tie-lambda-stack';

export const lambdaApiStackName = "CglOpServiceLambdaTruckServiceStack"
export const lambdaFunctionName = "legacy-lambda-truck-service-resources"

const app = new cdk.App();

const envSgp = { region: 'ap-southeast-1' }
const listLambda = ['']
new TieLambdaStack(app, 'CglOpServiceLambdaStack', { env: envSgp, });
