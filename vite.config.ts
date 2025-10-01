import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development'
  
  // Base configuration
  const config: any = {
    plugins: [],
  }
  
  // Only configure server options when in development mode
  if (isDev) {
    const certPath = path.resolve(__dirname, 'localhost-key.pem')
    const keyPath = path.resolve(__dirname, 'localhost.pem')
    
    config.server = {
      host: 'localhost',
      port: 5176,
      headers: {
        // Permissive CSP for local development only
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https: wss: ws:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; frame-ancestors https://app.kontent.ai;",
        // Disable some strict policies during development
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      }
    }
    
    // Only add HTTPS if certificates exist
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      config.server.https = {
        key: fs.readFileSync(certPath),
        cert: fs.readFileSync(keyPath),
      }
    }
  }
  
  return config
})