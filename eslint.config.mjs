import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import stylistic from '@stylistic/eslint-plugin';

// Matches this project's existing conventions (semicolons, double quotes, 2-space indent)
// rather than the plugin's Prettier-like defaults (no semicolons, single quotes).
const stylisticConfig = stylistic.configs.customize({
  indent: 2,
  quotes: 'single',
  semi: true,
});

export default [
  { files: ['**/*.{js,mjs,cjs,jsx}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReactHooks.configs['recommended-latest'],
  stylisticConfig,
];
