import pkg from "./package.json";
import { defineConfig } from "vite";

const deps = [...Object.keys(pkg.dependencies), "electron"];

export default defineConfig({
  optimizeDeps: {
    exclude: deps,
  },
  define: {
    IN_MAIN_PROCESS: false,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: deps,
    },
  },
});
