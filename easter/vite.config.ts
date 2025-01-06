import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      name: "MapGame",
      fileName: () => "easter.js",
      formats: ["iife"],
    },
    rollupOptions: {
      external: ["ol"],
      output: {
        globals: {
          ol: "ol",
        },
      },
    },
    minify: true,
    sourcemap: false,
    outDir: "dist",
    emptyOutDir: true,
  },
});
