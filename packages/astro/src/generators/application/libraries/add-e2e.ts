import { Tree, addProjectConfiguration, ensurePackage, getPackageManagerCommand, joinPathFragments } from '@nx/devkit';
import { NormalizedSchema } from '../schema';
import { checkHasPlugin } from './check-has-plugin';
import { nxVersion } from '../../../utilities/versions';
import { webStaticServeGenerator } from '@nx/web';
import { Linter } from '@nx/eslint';

type TestE2eRunnerProperties = {
  e2eTestRunnerFn: string;
  hasPlugin: boolean;
  tree: Tree;
  options: NormalizedSchema;
};

const testE2eOptions = {
  cypress({ e2eTestRunnerFn, hasPlugin, tree, options }: TestE2eRunnerProperties) {
    const { configurationGenerator } = ensurePackage<typeof import('@nx/cypress')>(`@nx/${e2eTestRunnerFn}`, nxVersion);

    if (!hasPlugin) {
      webStaticServeGenerator(tree, {
        buildTarget: `${options.projectName}:build`,
        outputPath: `${options.outputPath}/out`,
        targetName: 'serve-static',
      });
    }

    addProjectConfiguration(tree, options.e2eProjectName, {
      root: options.e2eProjectRoot,
      projectType: 'application',
      sourceRoot: joinPathFragments(options.e2eProjectRoot, 'src'),
      implicitDependencies: [options.projectName],
      targets: {},
      tags: [],
    });

    return configurationGenerator(tree, {
      ...options,
      linter: Linter.EsLint,
      project: options.e2eProjectName,
      directory: 'src',
      skipFormat: true,
      devServerTarget: `${options.projectName}:${hasPlugin ? 'start' : 'serve'}`,
      baseUrl: `http://localhost:${hasPlugin ? '3000' : '4200'}`,
      jsx: true,
      webServerCommands: hasPlugin
        ? {
            default: `nx run ${options.projectName}:serve`,
            production: `nx run ${options.projectName}:preview`,
          }
        : undefined,
      ciWebServerCommand: hasPlugin ? `nx run ${options.projectName}:serve-static` : undefined,
    });
  },
  playwright({ e2eTestRunnerFn, hasPlugin, tree, options }: TestE2eRunnerProperties) {
    const { configurationGenerator } = ensurePackage<typeof import('@nx/playwright')>(`@nx/${e2eTestRunnerFn}`, nxVersion);

    addProjectConfiguration(tree, options.e2eProjectName, {
      root: options.e2eProjectRoot,
      sourceRoot: joinPathFragments(options.e2eProjectRoot, 'src'),
      implicitDependencies: [options.projectName],
      targets: {},
      tags: [],
    });

    return configurationGenerator(tree, {
      rootProject: options.rootProject,
      project: options.e2eProjectName,
      skipFormat: true,
      skipPackageJson: options.skipPackageJson,
      directory: 'src',
      js: false,
      linter: options.linter,
      setParserOptionsProject: options.setParserOptionsProject,
      webServerAddress: `http://127.0.0.1:${hasPlugin ? '3000' : '4200'}`,
      webServerCommand: `${getPackageManagerCommand().exec} nx ${hasPlugin ? 'start' : 'serve'} ${options.projectName}`,
      addPlugin: options.addPlugin,
    });
  },
};

export async function addE2e(tree: Tree, options: NormalizedSchema) {
  const pluginName = '@mithho/astro/plugin';
  const hasPlugin = checkHasPlugin(tree, pluginName);

  for (const e2eTestRunnerFn in testE2eOptions) {
    if (options.e2eTestRunner === e2eTestRunnerFn) {
      return await testE2eOptions[e2eTestRunnerFn]({ e2eTestRunnerFn, hasPlugin, tree, options });
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {};
}
