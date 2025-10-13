import { fileURLToPath, URL } from "node:url";
import * as path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Base config for all environments
  const config: any = {
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
    ],
    server: {
      fs: {
        allow: ['../..']
      }
    },
    worker: {
      format: "es",
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        '@ext': path.resolve(__dirname, '../..'),
      },
    },
    build: {
      outDir: "dist",
      target: ["esnext"],
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`,
        },
      },
    },
  };

  // Development-only settings
  if (mode === "development") {
    // allow origin so that the sidebar from vscode can be loaded directly from localhost:5173 instead of in dist folder
    config.server = {
      cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"]
      },
      port: 5174
    };
  }

  return config;
});
