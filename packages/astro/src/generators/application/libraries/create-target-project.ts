import { TargetConfiguration, Tree } from '@nx/devkit';
import { NormalizedSchema } from '../schema';
import { checkHasPlugin } from './check-has-plugin';

export type TargetOptions = {
  [fn: string]: (targetName: string, options: NormalizedSchema) => TargetConfiguration<unknown>;
};

export function createTargetProject(targetOptions: TargetOptions, options: NormalizedSchema, tree: Tree) {
  const targets = {} as Record<string, TargetConfiguration<unknown>>;
  const pluginName = '@mithho/astro/plugin';

  if (!checkHasPlugin(tree, pluginName)) {
    for (const fn in targetOptions) {
      const targetName = fn.replace(/create|Target/g, '').toLowerCase();
      targets[targetName] = targetOptions[fn](targetName, options);
    }
  }

  return targets;
}
