import * as AWS from 'aws-sdk';
import * as os from 'os';
import { Logger } from './shell';

export interface ClientOptions {
  region: string;
  assumeRoleArn?: string;
  assumeRoleExternalId?: string;
}

export function s3Client(options: ClientOptions, logger?: Logger) {
  return new AWS.S3(awsOptions(options, logger));
}

export function ecrClient(options: ClientOptions, logger?: Logger) {
  return new AWS.ECR(awsOptions(options, logger));
}

function awsOptions(options: ClientOptions, logger?: Logger) {
  let credentials;

  if (options.assumeRoleArn) {
    credentials = new AWS.TemporaryCredentials({
      RoleArn: options.assumeRoleArn,
      ExternalId: options.assumeRoleExternalId,
      RoleSessionName: `Assets-${os.userInfo().username}`,
    });

    const msg = [`Assume ${options.assumeRoleArn}`];
    if (options.assumeRoleExternalId) {
      msg.push(`(ExternalId ${options.assumeRoleExternalId})`);
    }
    if (logger) { logger(msg.join(' ')); }
  }

  return {
    region: options.region,
    customUserAgent: 'cdk-assets',
    credentials,
  };
}