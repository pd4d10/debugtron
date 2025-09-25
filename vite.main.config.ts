import { defineConfig } from 'vite';
import packageJson from './package.json';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: Object.keys(packageJson.dependencies),
    },
  }
});
