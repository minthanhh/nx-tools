import { eslintPluginAstroVersion, eslintPluginJsxA11yVersion } from './versions';

export const extraEslintDependencies = {
  dependencies: {},
  devDependencies: {
    'eslint-plugin-jsx-a11y': eslintPluginJsxA11yVersion,
    'eslint-plugin-astro': eslintPluginAstroVersion,
  },
};
