import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@formkit/auto-animate/react"],
  },
  build: {
    // Allow the build to continue even if there are TypeScript errors
    typescript: {
      tsconfig: "./tsconfig.json",
      // Ignore errors during the build
      // If you're using TypeScript, this will allow the build to continue despite errors
    },
  },
});
