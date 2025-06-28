import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup/index.html"),
        "service-worker": resolve(__dirname, "background/service-worker.ts"),
        detector: resolve(__dirname, "content/detector.ts"),
        spoofer: resolve(__dirname, "content/spoofer.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name
          if (name === "popup") {
            return "popup/popup.js"
          }
          if (name === "service-worker") {
            return "background/service-worker.js"
          }
          if (name === "detector") {
            return "content/detector.js"
          }
          if (name === "spoofer") {
            return "content/spoofer.js"
          }
          return "[name].js"
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".html")) {
            return "popup/index.html"
          }
          if (assetInfo.name?.endsWith(".css")) {
            return "popup/styles.css"
          }
          return "assets/[name].[ext]"
        },
      },
    },
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    minify: false, // Disable minification for debugging
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
  define: {
    global: "globalThis",
  },
})
 