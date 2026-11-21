import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('./app', import.meta.url)),
  base: './',
  clearScreen: false,
  plugins: [vue()],
  server: {
    open: true,
    host: true,
    port: 8082,
    strictPort: true,
    watch: { usePolling: true },
  },
  preview: {
    open: true,
    host: true,
    port: 8083,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
