import * as AWS from 'aws-sdk';
import * as os from 'os';

export interface ClientOptions {
  region: string;
  assumeRoleArn?: string;
  assumeRoleExternalId?: string;
}

export function s3Client(options: ClientOptions) {
  return new AWS.S3(awsOptions(options));
}

export function ecrClient(options: ClientOptions) {
  return new AWS.ECR(awsOptions(options));
}

function awsOptions(options: ClientOptions) {
  const credentials = options.assumeRoleArn ? new AWS.TemporaryCredentials({
    RoleArn: options.assumeRoleArn,
    ExternalId: options.assumeRoleExternalId,
    RoleSessionName: `Assets-${os.userInfo().username}`,
  }) : undefined;

  return {
    region: options.region,
    customUserAgent: 'cdk-assets',
    credentials,
  };
}