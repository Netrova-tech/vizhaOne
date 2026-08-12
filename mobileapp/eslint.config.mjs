import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  // `legacy` is the already linted Vite application shared with this shell.
  // Next's server-rendering-only rules do not apply to the Capacitor client bundle.
  globalIgnores([".next/**", "out/**", "android/**", "legacy/**", "next-env.d.ts"]),
]);
