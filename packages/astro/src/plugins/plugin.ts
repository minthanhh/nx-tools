import {
  CreateDependencies,
  CreateNodes,
  CreateNodesContext,
  detectPackageManager,
  readJsonFile,
  TargetConfiguration,
  writeJsonFile,
} from '@nx/devkit';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { projectGraphCacheDirectory } from 'nx/src/utils/cache-directory';
import { calculateHashForCreateNodes } from '@nx/devkit/src/utils/calculate-hash-for-create-nodes';
import { getLockFileName } from '@nx/js';

export interface AstroPluginOptions {
  buildTargetName?: string;
  devTargetName?: string;
  checkTargetName?: string;
}

const cachePath = join(projectGraphCacheDirectory, 'astro.hash');
const targetsCache = existsSync(cachePath) ? readTargetsCache() : {};

const calculatedTargets: Record<string, Record<string, TargetConfiguration>> = {};

function readTargetsCache(): Record<string, Record<string, TargetConfiguration>> {
  return readJsonFile(cachePath);
}

function writeTargetsToCache(targets: Record<string, Record<string, TargetConfiguration>>) {
  writeJsonFile(cachePath, targets);
}

export const createDependencies: CreateDependencies = () => {
  writeTargetsToCache(calculatedTargets);
  return [];
};

function normalizeOptions(options: AstroPluginOptions): AstroPluginOptions {
  options ??= {};
  options.buildTargetName ??= 'build';
  options.devTargetName ??= 'dev';
  options.checkTargetName ??= 'check';
  return options;
}

export const createNodes: CreateNodes<AstroPluginOptions> = [
  '**/astro.config.{js,cjs,mjs}',
  async (configFilePath, options, context) => {
    const projectRoot = dirname(configFilePath);

    // Do not create a project if package.json and project.json isn't there.
    const siblingFiles = readdirSync(join(context.workspaceRoot, projectRoot));
    if (!siblingFiles.includes('package.json') && !siblingFiles.includes('project.json')) {
      return {};
    }
    options = normalizeOptions(options);

    const hash = calculateHashForCreateNodes(projectRoot, options, context, [getLockFileName(detectPackageManager(context.workspaceRoot))]);

    const targets = targetsCache[hash] ? targetsCache[hash] : await buildAstroTargets(configFilePath, projectRoot, options, context);

    calculatedTargets[hash] = targets;

    return {
      projects: {
        [projectRoot]: {
          root: projectRoot,
          targets,
        },
      },
    };
  },
];

async function buildAstroTargets(astroConfigPath: string, projectRoot: string, options: AstroPluginOptions, context: CreateNodesContext) {
  const targets: Record<string, TargetConfiguration> = {};
  targets[options.devTargetName] = getDevTargetConfig(projectRoot);

  return targets;
}

function getDevTargetConfig(projectRoot: string): TargetConfiguration {
  return {
    command: `astro dev`,
    options: { cwd: projectRoot },
  };
}
