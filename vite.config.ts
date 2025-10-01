import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development'
  
  return {
    plugins: [],
    server: {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
      },
      host: 'localhost',
      port: 5176,
      // just for development: headers permisivos
      headers: isDev ? {
        // permissive CSP for local development only
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https: wss: ws:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; frame-ancestors https://app.kontent.ai;",
        // Disable some strict policies during development
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      } : undefined
    }
  }
})