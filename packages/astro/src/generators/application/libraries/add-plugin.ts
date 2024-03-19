import { Tree, readNxJson, updateNxJson } from '@nx/devkit';

export function addPlugin(tree: Tree) {
  const nxJson = readNxJson(tree);
  nxJson.plugins ??= [];

  for (const plugin of nxJson.plugins) {
    if (typeof plugin === 'string' ? plugin === '@mithho/astro/plugin' : plugin.plugin === '@mithho/astro/plugin') {
      return;
    }
  }

  nxJson.plugins.push({
    plugin: '@mithho/astro/plugin',
    options: {
      serveTargetName: 'serve',
    },
  });

  updateNxJson(tree, nxJson);
}
