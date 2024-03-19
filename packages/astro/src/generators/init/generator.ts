import {
  Tree,
  runTasksInSerial,
  GeneratorCallback,
  addDependenciesToPackageJson,
  removeDependenciesFromPackageJson,
  readNxJson,
  NxJsonConfiguration,
} from '@nx/devkit';
import { astroJsCheckVersion, typescriptVersion, astroVersion, nxVersion } from '../../utilities/versions';
import { InitSchema } from './schema';
import { addPlugin } from '../application/libraries/add-plugin';
import { updatePackageScripts } from '@nx/devkit/src/utils/update-package-scripts';

export function astroInitGenerator(tree: Tree, schema: InitSchema) {
  return astroInitGeneratorInternal(tree, { addPlugin: false, ...schema });
}

function updateDependencies(host: Tree, schema: InitSchema) {
  const tasks: GeneratorCallback[] = [];

  tasks.push(removeDependenciesFromPackageJson(host, ['@mithho/astro'], []));
  tasks.push(
    addDependenciesToPackageJson(
      host,
      { astro: astroVersion, '@astrojs/check': astroJsCheckVersion, typescript: typescriptVersion },
      { '@mithho/astro': nxVersion },
      undefined,
      schema.keepExistingVersions
    )
  );

  return runTasksInSerial(...tasks);
}

async function astroInitGeneratorInternal(host: Tree, schema: InitSchema) {
  const nxJson = readNxJson(host);
  const addPluginDefault = process.env.NX_ADD_PLUGINS !== 'false' && (nxJson as any).useInferencePlugins !== false;
  console.log(addPluginDefault);
  schema.addPlugin ??= addPluginDefault;
  console.log(schema.addPlugin);

  if (schema.addPlugin) {
    addPlugin(host);
  }

  // addGitIgnoreEntry(host);

  let installTask: GeneratorCallback = () => {};
  if (!schema.skipPackageJson) {
    installTask = updateDependencies(host, schema);
  }

  if (schema.updatePackageScripts) {
    const { createNodes } = await import('../../plugins/plugin');
    await updatePackageScripts(host, createNodes);
  }

  return installTask;
}
