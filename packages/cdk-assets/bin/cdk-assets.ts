import { AssetIdentifier, AssetManifest } from '@aws-cdk/assets';
import * as winston from 'winston';
import * as yargs from 'yargs';
import { AssetPublishing, IPublishProgress, IPublishProgressListener } from '../lib';

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

    const selectedAssets = manifest.select(selection);
    const pub = new AssetPublishing(selectedAssets, new ConsoleProgress());

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

main().catch(e => {
  // tslint:disable-next-line:no-console
  console.error(e);
  process.exit(1);
});