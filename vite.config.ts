import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup/index.html"),
        "background/service-worker": resolve(__dirname, "background/service-worker.ts"),
        "content/detector": resolve(__dirname, "content/detector.ts"),
        "content/spoofer": resolve(__dirname, "content/spoofer.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "popup") {
            return "popup/[name].js"
          }
          return "[name].js"
        },
        chunkFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".html")) {
            return "popup/[name].[ext]"
          }
          return "[name].[ext]"
        },
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
})
