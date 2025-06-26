import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  // pluginReactConfig,
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReactConfig.configs.flat.recommended,
  pluginReactConfig.configs.flat["jsx-runtime"],
  reactHooks.configs["recommended-latest"],
];
