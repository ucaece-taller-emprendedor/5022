import { defineConfig } from 'vitest/config'

// Vitest corre los tests de reglas de Firestore (necesitan el emulador: npm run test:reglas) y los unitarios.
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
    // Evita que firebase se cargue dos veces (ESM y CJS) y rompa el contexto de pruebas.
    server: { deps: { inline: [/@firebase\/rules-unit-testing/, /firebase\//] } },
  },
})
