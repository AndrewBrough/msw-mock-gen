import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{ts,md,json,js,jsx,tsx}"],
    languageOptions: { globals: globals.browser },
  },
  ...tseslint.configs.recommended,
];
