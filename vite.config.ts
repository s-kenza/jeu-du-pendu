import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    },
    // drop: ['console', 'debugger']
  },
  base: '/',
  build: {
    sourcemap: true,
  }
})
