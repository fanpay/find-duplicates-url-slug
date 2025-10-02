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
      open: false, // Don't auto-open browser
      headers: {
        // Permissive CSP for local development only
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https: wss: ws:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; frame-ancestors https://app.kontent.ai;",
        // Allow iframe embedding from Kontent.ai
        'X-Frame-Options': 'ALLOW-FROM https://app.kontent.ai',
        // Disable strict policies during development
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      }
    }
    
    // Try to use HTTPS with certificates, fallback to HTTP if not available
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      try {
        config.server.https = {
          key: fs.readFileSync(certPath),
          cert: fs.readFileSync(keyPath),
        }
        console.log('🔒 Using HTTPS with local certificates')
      } catch (error) {
        console.warn('⚠️  Certificate error, falling back to HTTP:', error instanceof Error ? error.message : 'Unknown error')
      }
    } else {
      console.log('📄 No certificates found, using HTTP (use ngrok for Kontent.ai testing)')
    }
  }
  
  return config
})