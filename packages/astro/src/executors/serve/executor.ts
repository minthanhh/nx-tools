import { ExecutorContext, workspaceRoot } from '@nx/devkit';
import { AstroServeBuilderOptions } from './schema';
import { waitForPortOpen } from '@nx/web/src/utils/wait-for-port-open';
import { createAsyncIterable } from '@nx/devkit/src/utils/async-iterable';
import { fork } from 'child_process';
import { join } from 'path';

export default async function* serveExecutor(options: AstroServeBuilderOptions, context: ExecutorContext) {
  const projectRoot = context.workspace.projects[context.projectName].root;

  (process.env as any).NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
  process.env.PORT = options.port ? `${options.port}` : process.env.PORT;
  options.port = parseInt(process.env.PORT);

  const astroBin = require.resolve('astro');

  yield* createAsyncIterable<{ success: boolean; baseUrl: string }>(async ({ done, error, next }) => {
    const server = fork(astroBin, ['dev', ...getAstroDevArgs(projectRoot, options)], {
      cwd: join(workspaceRoot, projectRoot),
      stdio: 'inherit',
    });

    server.once('exit', (code) => {
      if (code === 0) {
        done();
      } else {
        error(new Error(`Astro.js app exited with code ${code}`));
      }
    });

    const killServer = () => {
      if (server.connected) {
        server.kill('SIGTERM');
      }
    };

    process.on('exit', () => killServer());
    process.on('SIGINT', () => killServer());
    process.on('SIGTERM', () => killServer());
    process.on('SIGHUP', () => killServer());

    await waitForPortOpen(options.port, { host: options.host });

    next({ success: true, baseUrl: `http://${options.host ?? 'localhost'}:${options.port}` });
  });
}

function getAstroDevArgs(projectRoot: string, options: AstroServeBuilderOptions): string[] {
  const args: string[] = ['--root', projectRoot];

  if (options.config) {
    args.push('--config', options.config);
  }
  if (options.host !== undefined) {
    if (typeof options.host === 'boolean') {
      args.push(options.host === true ? '--host' : '--no-host');
    } else {
      args.push('--host', options.host.toString());
    }
  }
  if (options.port) {
    args.push('--port', options.port.toString());
  }
  if (options.silent) {
    args.push('--silent');
  }
  if (options.site) {
    args.push('--site', options.site);
  }
  if (options.verbose) {
    args.push('--verbose');
  }
  return args;
}
