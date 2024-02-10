module.exports = {
  packagerConfig: {
    asar: true,
    appBundleId: "io.github.pd4d10.debugtron",
    icon: "assets/icon",
  },
  makers: [
    { name: "@electron-forge/maker-squirrel", config: {} },
    { name: "@electron-forge/maker-zip", platforms: ["darwin"] },
    { name: "@electron-forge/maker-deb", config: {} },
    { name: "@electron-forge/maker-dmg", config: {} },
    { name: "@electron-forge/maker-rpm", config: {} },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-vite",
      config: {
        build: [
          { entry: "src/main.ts", config: "vite.main.config.ts" },
          {
            entry: "src/preload.ts",
            // config: 'vite.preload.config.ts',
          },
        ],
        renderer: [{ name: "main_window", config: "vite.renderer.config.ts" }],
      },
    },
    { name: "@electron-forge/plugin-auto-unpack-natives", config: {} },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "bytedance",
          name: "debugtron",
        },
      },
    },
  ],
};
