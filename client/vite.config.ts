// client/vite.config.ts
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
// Only import tailwindcss if available
let tailwindcss;
try {
  tailwindcss = require("@tailwindcss/vite").default;
} catch (error) {
  console.warn("Tailwind CSS plugin not found, continuing without it");
  tailwindcss = null;
}

// Determine environment
const isProduction = process.env.NODE_ENV === "production";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: tailwindcss ? [react(), tailwindcss()] : [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Only configure the dev server for local development
  ...(isProduction
    ? {}
    : {
        server: {
          port: 3000,
          proxy: {
            "/api": {
              target: "http://localhost:3001",
              changeOrigin: true,
              secure: false,
            },
          },
        },
      }),
  // Add specific build options for production
  build: {
    outDir: "build",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: [
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-label",
            "@radix-ui/react-select",
            "@radix-ui/react-slot",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
          ],
        },
      },
    },
  },
});
