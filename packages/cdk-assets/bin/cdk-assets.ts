import { AssetIdentifier, AssetManifest } from '@aws-cdk/assets';
import * as AWS from 'aws-sdk';
import * as os from 'os';
import * as winston from 'winston';
import * as yargs from 'yargs';
import { AssetPublishing, IPublishProgress, IPublishProgressListener } from '../lib';
import { ClientOptions, IAws } from '../lib/aws-operations';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.cli(),
  transports: [ new winston.transports.Console({ stderrLevels: ['info', 'debug', 'verbose', 'error'] })  ]
});

async function main() {
  const argv = yargs
  .usage('$0 <cmd> [args]')
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    desc: 'Increase logging verbosity',
    count: true,
    default: 0
  })
  .command('ls PATH', 'List assets from the given manifest', command => command
    .positional('PATH', { type: 'string', describe: 'Manifest file or cdk.out directory' })
    .require('PATH')
  , wrapHandler(async args => {
    const manifest = AssetManifest.fromPath(args.PATH);
    // tslint:disable-next-line:no-console
    console.log(manifest.list().join('\n'));
  }))
  .command('publish PATH [ASSET..]', 'Publish assets in the given manifest', command => command
    .positional('PATH', { type: 'string', describe: 'Manifest file or cdk.out directory' })
    .require('PATH')
    .positional('ASSET', { type: 'string', array: true, describe: 'Assets to publish (format: "ASSET[:DEST]"), default all' })
    .array('ASSET')
  , wrapHandler(async args => {
    const manifest = AssetManifest.fromPath(args.PATH);
    const selection = args.ASSET && args.ASSET.length > 0 ? args.ASSET.map(a => AssetIdentifier.fromString(a)) : undefined;

    const pub = new AssetPublishing({
      manifest: manifest.select(selection),
      aws: new DefaultAwsClient(),
      progressListener: new ConsoleProgress()
    });

    await pub.publish();

    if (pub.hasFailures) {
      process.exit(1);
    }
  }))
  .demandCommand()
  .help()
  .strict()  // Error on wrong command
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  .version(require('../package.json').version)
  .showHelpOnFail(false)
  .argv;

  // Evaluating .argv triggers the parsing but the command gets implicitly executed,
  // so we don't need the output.
  Array.isArray(argv);
}

/**
 * Wrap a command's handler with standard pre- and post-work
 */
function wrapHandler<A extends { verbose?: number }, R>(handler: (x: A) => Promise<R>) {
  const levels = ['info', 'verbose', 'debug', 'silly'];
  return async (argv: A) => {
    logger.transports.forEach(transport => {
      transport.level = levels[Math.min(argv.verbose ?? 0, levels.length - 1)];
    });
    await handler(argv);
  };
}

class ConsoleProgress implements IPublishProgressListener {
  public onAssetStart(event: IPublishProgress): void {
    logger.info(`[${event.percentComplete}%] ${event.message}`);
  }
  public onAssetEnd(event: IPublishProgress): void {
    logger.info(`[${event.percentComplete}%] ${event.message}`);
  }
  public onEvent(event: IPublishProgress): void {
    logger.verbose(`[${event.percentComplete}%] ${event.message}`);
  }
  public onError(event: IPublishProgress): void {
    logger.error(`${event.message}`);
  }
}

/**
 * AWS client using the AWS SDK for JS with no special configuration
 */
class DefaultAwsClient implements IAws {
  public s3Client(options: ClientOptions) {
    return new AWS.S3(this.awsOptions(options));
  }

  public ecrClient(options: ClientOptions) {
    return new AWS.ECR(this.awsOptions(options));
  }

  private awsOptions(options: ClientOptions) {
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
      if (logger) { logger.verbose(msg.join(' ')); }
    }

    return {
      region: options.region,
      customUserAgent: 'cdk-assets',
      credentials,
    };
  }
}

main().catch(e => {
  // tslint:disable-next-line:no-console
  console.error(e);
  process.exit(1);
});