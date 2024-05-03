import pkg from "./package.json";
import { defineConfig } from "vite";

export default defineConfig({
  define: {
    IN_MAIN_PROCESS: true,
  },
  build: {
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: Object.keys(pkg.dependencies),
    },
  },
});
