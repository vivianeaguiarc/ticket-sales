import { defineConfig, mergeConfig } from 'vitest/config'

import vitestConfig from './vitest.config.js'

export default mergeConfig(
  vitestConfig,
  defineConfig({
    test: {
      include: ['src/e2e/**/*.e2e.test.ts'],
      fileParallelism: false
    }
  })
)
