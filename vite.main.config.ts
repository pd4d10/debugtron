import { defineConfig } from "vite";

export default defineConfig({
  define: {
    DEBUGTRON_GITHUB_TOKEN: JSON.stringify(process.env.DEBUGTRON_GITHUB_TOKEN),
  },
  build: {
    minify: false,
    rollupOptions: {
      external: ["registry-js"],
    },
  },
});
