import { Tree, generateFiles, offsetFromRoot, names } from '@nx/devkit';
import { NormalizedSchema } from '../schema';
import { join } from 'path';

export function createApplicationFiles(tree: Tree, options: NormalizedSchema) {
  const templateVariables = {
    ...names(options.name),
    ...options,
    dot: '.',
    tmpl: '',
    offsetFromRoot: offsetFromRoot(options.appProjectRoot),
  };

  generateFiles(tree, join(__dirname, '../files/base-astro'), options.appProjectRoot, templateVariables);
}
