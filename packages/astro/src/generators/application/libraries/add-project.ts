import { Tree, addProjectConfiguration } from '@nx/devkit';
import { NormalizedSchema } from '../schema';
import { TargetOptions, createTargetProject } from './create-target-project';

const targetOptions: TargetOptions = {
  createServeTarget(targetName, options) {
    return {
      executor: `@mithho/astro:${targetName}`,
      outputs: ['{options.outputPath}'],
      defaultConfiguration: 'development',
      options: {
        outputPath: options.outputPath,
      },
      cache: true,
    };
  },
};

export function addProject(tree: Tree, options: NormalizedSchema) {
  addProjectConfiguration(tree, options.projectName, {
    root: options.appProjectRoot,
    sourceRoot: options.appProjectRoot,
    projectType: 'application',
    targets: createTargetProject(targetOptions, options, tree),
    tags: options.parsedTags,
  });
}
