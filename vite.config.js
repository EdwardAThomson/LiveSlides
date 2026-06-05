import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkGfm
      ],
    })},
    react(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        audience: resolve(__dirname, 'audience.html'),
      },
    },
  },
  // Dedicated, fixed dev port so Tauri's devUrl always points at *this* app.
  // strictPort makes Vite fail loudly if 1420 is taken rather than silently
  // falling back to another port (which would load the wrong app in Tauri).
  server: {
    port: 5183,
    strictPort: true,
  },
})
