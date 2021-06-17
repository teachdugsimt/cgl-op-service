import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";


export class LambdaLayerPackageApiStack extends cdk.NestedStack {
  layerPackageNpm: lambda.LayerVersion
  constructor(scope: cdk.Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    // layer
    this.layerPackageNpm = new lambda.LayerVersion(this, 'package-without-connection', {
      code: lambda.Code.fromAsset('../package-npm/fastify-without-connection/'), // ** muse be pack root folder
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X, lambda.Runtime.NODEJS_14_X],
      license: 'Apache-2.0',
      description: 'The Lambda Layer with out db connection',
      layerVersionName: 'layer-with-none-typeorm'
    });

  }
}
