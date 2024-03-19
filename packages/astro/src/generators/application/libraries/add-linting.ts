import { GeneratorCallback, Tree, addDependenciesToPackageJson, joinPathFragments, runTasksInSerial } from '@nx/devkit';
import { NormalizedSchema } from '../schema';
import { Linter, lintProjectGenerator } from '@nx/eslint';
import { addExtendsToLintConfig, isEslintConfigSupported, updateOverrideInLintConfig } from '@nx/eslint/src/generators/utils/eslint-file';
import { extraEslintDependencies } from '../../../utilities/lint';

export async function addLinting(tree: Tree, options: NormalizedSchema): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = [];

  tasks.push(
    await lintProjectGenerator(tree, {
      linter: options.linter,
      project: options.projectName,
      tsConfigPaths: [joinPathFragments(options.appProjectRoot, 'tsconfig.app.json')],
      skipFormat: true,
      rootProject: options.rootProject,
      setParserOptionsProject: options.setParserOptionsProject,
      addPlugin: options.addPlugin,
    })
  );

  if (options.linter === Linter.EsLint && isEslintConfigSupported(tree)) {
    addExtendsToLintConfig(tree, options.appProjectRoot, ['plugin:astro/recommended']);
    updateOverrideInLintConfig(
      tree,
      options.appProjectRoot,
      (o) =>
        Array.isArray(o.files) &&
        o.files.some((f) => f.match(/\*\.ts$/)) &&
        o.files.some((f) => f.match(/\*\.tsx$/)) &&
        o.files.some((f) => f.match(/\*\.js$/)) &&
        o.files.some((f) => f.match(/\*\.jsx$/)),
      (o) => ({
        ...o,
        files: ['*.astro'],
        // Allows Astro components to be parsed.
        parser: 'astro-eslint-parser',
        // Parse the script in `.astro` as TypeScript by adding the following configuration.
        // It's the setting you need when using TypeScript.
        parserOptions: {
          parser: '@typescript-eslint/parser',
          extraFileExtensions: ['.astro'],
        },
        // rules: {
        //   ...o.rules,
        //   '@next/next/no-html-link-for-pages': ['error', `${options.appProjectRoot}/pages`],
        // },
      })
    );
    // add jest specific config
    // if (options.unitTestRunner === 'jest') {
    //   addOverrideToLintConfig(host, options.appProjectRoot, {
    //     files: ['*.spec.ts', '*.spec.tsx', '*.spec.js', '*.spec.jsx'],
    //     env: {
    //       jest: true,
    //     },
    //   });
    // }
    // addIgnoresToLintConfig(tree, options.appProjectRoot, ['.next/**/*']);
  }

  if (!options.skipPackageJson) {
    tasks.push(
      addDependenciesToPackageJson(tree, extraEslintDependencies.dependencies, {
        ...extraEslintDependencies.devDependencies,
      })
    );
  }

  return runTasksInSerial(...tasks);
}
