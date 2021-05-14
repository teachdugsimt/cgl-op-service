import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";


export class LambdaLayerStack extends cdk.NestedStack {
  layer: lambda.LayerVersion
  constructor(scope: cdk.Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    // layer
    this.layer = new lambda.LayerVersion(this, 'utility-layer', {
      code: lambda.Code.fromAsset('../utility-layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
      license: 'Apache-2.0',
      description: 'A layer that enables initial to run in AWS Lambda',
    });

  }
}
