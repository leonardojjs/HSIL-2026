import { resolve } from 'path'
import { defineConfig } from 'defineConfig'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
})