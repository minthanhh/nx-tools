import { GeneratorCallback, Tree, formatFiles, runTasksInSerial } from '@nx/devkit';
import type { Schema } from './schema';
import { logShowProjectCommand } from '@nx/devkit/src/utils/log-show-project-command';

// Libraries supported
import { normalizedOptions } from './libraries/normalize-options';
import { astroInitGenerator } from '../init/generator';
import { createApplicationFiles } from './libraries/create-application-file';
import { addProject } from './libraries/add-project';
import { addE2e } from './libraries/add-e2e';
import { addLinting } from './libraries/add-linting';
import { setDefaults } from './libraries/set-default';

export async function applicationGenerator(host: Tree, schema: Schema) {
  return await applicationGeneratorInternal(host, { addPlugin: false, projectNameAndRootFormat: 'derived', ...schema });
}

export async function applicationGeneratorInternal(host: Tree, schema: Schema) {
  const tasks: GeneratorCallback[] = [];
  const options = await normalizedOptions(host, schema);

  const astroInitTask = await astroInitGenerator(host, { ...options, skipFormat: true });
  tasks.push(astroInitTask);

  createApplicationFiles(host, options);
  addProject(host, options);

  const e2eTask = await addE2e(host, options);
  tasks.push(e2eTask);

  const lintTask = await addLinting(host, options);
  tasks.push(lintTask);

  setDefaults(host, options);

  if (!options.skipFormat) {
    await formatFiles(host);
  }

  tasks.push(() => {
    logShowProjectCommand(options.projectName);
  });

  return runTasksInSerial(...tasks);
}
