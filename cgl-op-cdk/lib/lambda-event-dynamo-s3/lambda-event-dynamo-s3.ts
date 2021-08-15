
import * as cdk from '@aws-cdk/core';
import * as  lambda from '@aws-cdk/aws-lambda'
import { PolicyStatement } from "@aws-cdk/aws-iam"
import * as events from '@aws-cdk/aws-events'
import * as target from "@aws-cdk/aws-events-targets"

export class CargolinkDocumentStack extends cdk.Stack {
  documentEvnetSchedule: lambda.Function

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaPolicy = new PolicyStatement({
      actions: ["dynamodb:*", "s3:*"]
    })
    lambdaPolicy.addAllResources()

    this.documentEvnetSchedule = new lambda.Function(this, 'CglOpDocumentEvent', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'dist/document-event-handler.handler',
      code: lambda.Code.fromAsset('../cgl-op-document-event', {
        exclude: ['src/*', 'test/*']
      }),
      timeout: cdk.Duration.millis(30000),
      initialPolicy: [lambdaPolicy],
      functionName: id,
      environment: {
        "DOCUMENT_BUCKET": process.env.S3_BUCKET_NAME || "cargolink-documents",
        "TABLE_ATTACH_CODE": "cgl_attach_code",
      }
    });

    // 10:15 AM (UTC) every day => cron(15 10 * * ? *)
    // 6:00 PM Monday through Friday => cron(0 18 ? * MON-FRI *)
    // 8:00 AM on the first day of the month => cron(0 8 1 * ? *)
    // Every 10 min on weekdays => cron(0/10 * ? * MON-FRI *)
    // Every 5 minutes between 8:00 AM and 5:55 PM weekdays => cron(0/5 8-17 ? * MON-FRI *)
    // 9:00 AM on the first Monday of each month => cron(0 9 ? * 2#1 *)
    const documentRule = new events.Rule(this, "CglDocumentRule", {
      schedule: events.Schedule.expression('cron(0 18 ? * SUN *)'), // Run every day at 6PM UTC
      // schedule: events.Schedule.expression('cron(0/5 * ? * * *)'),
      enabled: true,
      ruleName: 'cgl-op-document-shedule'
    })
    documentRule.addTarget(new target.LambdaFunction(this.documentEvnetSchedule));
  }
}
