import { Tree, extractLayoutDirectory, joinPathFragments, names, readNxJson } from '@nx/devkit';
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { NormalizedSchema, Schema } from '../schema';

export function normalizeDirectory(options: Schema) {
  options.directory = options.directory?.replace(/\\{1,2}/g, '/');
  const { projectDirectory } = extractLayoutDirectory(options.directory);
  return projectDirectory ? `${names(projectDirectory).fileName}/${names(options.name).fileName}` : names(options.name).fileName;
}

export function normalizeProjectName(options: Schema) {
  return normalizeDirectory(options).replace(new RegExp('/', 'g'), '-');
}

export async function normalizedOptions(host: Tree, options: Schema, callingGenerator = '@mithho/astro:application'): Promise<NormalizedSchema> {
  const {
    projectName: appProjectName,
    projectRoot: appProjectRoot,
    projectNameAndRootFormat,
  } = await determineProjectNameAndRootOptions(host, {
    name: options.name,
    projectType: 'application',
    directory: options.directory,
    projectNameAndRootFormat: options.projectNameAndRootFormat,
    rootProject: options.rootProject,
    callingGenerator,
  });

  const nxJson = readNxJson(host);
  const addPlugin = process.env.NX_ADD_PLUGINS !== 'false' && (nxJson as { useInferencePlugins: boolean }).useInferencePlugins !== false;

  options.addPlugin ??= addPlugin;

  options.rootProject = appProjectRoot === '.';
  options.projectNameAndRootFormat = projectNameAndRootFormat;
  const e2eProjectRoot = options.rootProject ? 'e2e' : `${appProjectRoot}-e2e`;
  const e2eProjectName = options.rootProject ? 'e2e' : `${appProjectName}-e2e`;
  const name = names(options.name).fileName;
  const outputPath = joinPathFragments('dist', appProjectRoot, ...(options.rootProject ? [name] : []));

  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];

  const styledModule = /^(css|scss|less|tailwind|none)$/.test(options.style) ? null : options.style;

  const src = options.src ?? true;

  return {
    ...options,
    src,
    appProjectRoot,
    e2eProjectName,
    e2eProjectRoot,
    e2eTestRunner: options.e2eTestRunner || 'cypress',
    // linter: options.linter || Linter.EsLint,
    name,
    outputPath,
    parsedTags,
    projectName: appProjectName,
    style: options.style || 'css',
    styledModule,
    // unitTestRunner: options.unitTestRunner || 'jest',
  };
}
