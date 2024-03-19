import { Tree, readNxJson } from '@nx/devkit';

export function checkHasPlugin(tree: Tree, pluginName: string) {
  const nxJson = readNxJson(tree);
  return nxJson.plugins?.some((p) => (typeof p === 'string' ? p === pluginName : p.plugin === pluginName));
}
