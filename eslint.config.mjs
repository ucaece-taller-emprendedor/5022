import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ["legacy/**", ".next/**", "drizzle/**", "playwright-report/**", "test-results/**"] },
];

export default config;
