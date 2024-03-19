import { readNxJson, Tree, updateNxJson } from '@nx/devkit';
import { NormalizedSchema } from '../schema';

export function setDefaults(tree: Tree, options: NormalizedSchema) {
  const nxJson = readNxJson(tree);

  nxJson.generators ??= {};
  nxJson.generators['@mithho/astro'] ??= {};
  nxJson.generators['@mithho/astro'].application ??= {};
  nxJson.generators['@mithho/astro'].application.style ??= options.style;
  nxJson.generators['@mithho/astro'].application.linter ??= options.linter;

  updateNxJson(tree, nxJson);
}
