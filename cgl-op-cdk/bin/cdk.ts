#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CglOpCdkStack } from '../lib/cgl-op-cdk-stack';

const app = new cdk.App();
const envSgp = { region: 'ap-southeast-1' }
new CglOpCdkStack(app, 'CglOpCdkStack', { env: envSgp });
