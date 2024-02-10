import { defineConfig } from "vite";
import pkg from "./package.json";

export default defineConfig({
  define: {
    DEBUGTRON_GITHUB_TOKEN: JSON.stringify(process.env.DEBUGTRON_GITHUB_TOKEN),
  },
  build: {
    minify: false,
    rollupOptions: {
      external: Object.keys(pkg.dependencies),
    },
  },
});
