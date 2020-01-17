import * as winston from 'winston';
import * as yargs from 'yargs';
import { AssetsOperations } from '../lib';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.cli(),
  transports: [ new winston.transports.Console() ]
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
    .positional('PATH', { type: 'string', required: true, describe: 'Manifest file or cdk.out directory' })
  , wrapHandler(async args => {
    const ops = await AssetsOperations.fromPath(args.PATH!);
    ops.list();
  }))
  .command('publish PATH', 'Publish assets in the given manifest', command => command
    .positional('PATH', { type: 'string', describe: 'Manifest file or cdk.out directory' })
  , wrapHandler(async args => {
    // tslint:disable-next-line:no-console
    console.log(args);
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

main().catch(e => {
  // tslint:disable-next-line:no-console
  console.error(e);
  process.exit(1);
});