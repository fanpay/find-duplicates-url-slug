import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
    },
    host: 'localhost',
    port: 5173,
  }
})