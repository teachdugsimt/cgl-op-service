#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TieLambdaStack } from '../lib/tie-lambda-stack';
// import { CglOpCdkStack } from '../lib/cgl-op-cdk-stack';

const app = new cdk.App();
const envSgp = { region: 'ap-southeast-1' }
new TieLambdaStack(app, 'CglOpServiceLambdaStack', { env: envSgp });
// new CglOpCdkStack(app, 'CglOpServiceApiGWStack', { env: envSgp });
