import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Disable react-refresh/only-export-components for files where mixing
  // component + non-component exports is intentional/idiomatic:
  // - shadcn ui components legitimately co-export helpers/variants alongside the component
  // - AuthContext.tsx co-exports the Provider component with the Context object
  // - SEO.tsx co-exports helpers with the component
  // The warning is about Vite's hot-reload, not production correctness.
  {
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/contexts/AuthContext.tsx",
      "src/components/SEO.tsx",
      "src/components/CountrySelector.tsx",
      "src/components/FishSpeciesFilter.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);