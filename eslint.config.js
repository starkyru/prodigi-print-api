import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    // `**/` so the explorer's local build output is ignored too. CI never sees
    // it (fresh checkout, gitignored), so without this local lint diverges.
    ignores: ["**/dist/"],
  },
);
