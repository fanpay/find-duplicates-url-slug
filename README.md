# Kontent.ai Duplicate URL Slug Finder

A lightweight custom app for Kontent.ai that detects and manages duplicate URL slugs across page content items in multiple languages.

## 🚀 Features

- **Search Specific Slugs**: Find all content items using a specific URL slug
- **Detect Real Duplicates**: Identify different content items sharing the same slug (not just language variants)
- **Multi-language Support**: Handles content across multiple languages (default: `de`, `en`, `zh`)
- **Official SDK Integration**: Uses `@kontent-ai/delivery-sdk` for reliable API communication
- **Automatic Pagination**: SDK handles large content sets automatically with `.toAllPromise()`
- **Real-time Analysis**: Instant duplicate detection with detailed results
- **Lightweight**: Built with TypeScript + Vite, no heavy frameworks

## 📋 Quick Start

### 1. Environment Setup

Create a `.env` file:
```bash
cp .env.example .env
```

Configure your Kontent.ai credentials:
```env
VITE_KONTENT_PROJECT_ID=your-environment-id
VITE_KONTENT_ENVIRONMENT_ID=your-environment-id
```

### 2. Development

```bash
# Install dependencies
npm install

# Local development (HTTP)
npm run dev

# Local development with HTTPS (for Kontent.ai integration)
npm run dev:secure

# Public tunnel for Kontent.ai testing
npm run dev:tunnel

# Production simulation
npm run dev:netlify
```

### 3. Kontent.ai Integration

1. **Development**: Use `https://localhost:5176` (accept SSL warnings)
2. **Production**: Deploy to Netlify, use the generated URL
3. **Testing**: Use ngrok tunnel for public HTTPS access

## 🔧 Development Modes

| Command | URL | Use Case | Kontent.ai Compatible |
|---------|-----|----------|----------------------|
| `npm run dev` | `http://localhost:5176` | Basic development | ❌ No (HTTP) |
| `npm run dev:secure` | `https://localhost:5176` | Kontent.ai testing | ✅ Yes (with SSL warnings) |
| `npm run dev:tunnel` | `https://*.ngrok-free.app` | Public testing | ✅ Yes (valid SSL) |
| `npm run dev:netlify` | `https://localhost:8888` | Production simulation | ✅ Yes |

## 🌐 Deployment

### Netlify (Recommended)

1. **Connect Repository**: Link your GitHub repo to Netlify
2. **Environment Variables**: Set in Netlify dashboard:
   ```
   VITE_KONTENT_PROJECT_ID = your-environment-id
   VITE_KONTENT_ENVIRONMENT_ID = your-environment-id
   ```
3. **Auto-deploy**: Push to main branch triggers deployment
4. **Use in Kontent.ai**: Add your Netlify URL as Custom App

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 📖 How to Get Environment ID

### Option 1: From Kontent.ai URL
Visit your project: `https://app.kontent.ai/goto/project/[ENVIRONMENT-ID]/dashboard`

### Option 2: Environment Settings
Kontent.ai → Environment settings → General → Environment ID

### Option 3: Automatic (Recommended)
When integrated as Custom App, the SDK automatically provides the Environment ID.

## 🏗️ Architecture

```
src/
├── main.ts           # Application entry point
├── components/       # UI components
├── config/          # Environment & SDK configuration
├── services/        # API integrations (Delivery/Management)
├── types/           # TypeScript definitions
└── utils/           # Helper functions
```

## 🔒 Security

### Development Environment
- Permissive CSP for easy debugging
- HTTPS with self-signed certificates
- Relaxed CORS policies

### Production Environment
- Strict Content Security Policy
- Security headers (HSTS, X-Frame-Options, etc.)
- Only allows specific domains (Kontent.ai, CDNs)

## 🛠️ Configuration Priority

1. **Kontent.ai Custom App SDK** (when embedded in Kontent.ai)
2. **Environment Variables** (`.env` file or deployment settings)
3. **Manual Configuration** (fallback)

## 🐛 Troubleshooting

### `process is not defined`
✅ **Fixed**: Now uses `import.meta.env` instead of `process.env`

### SSL Certificate Warnings
- ✅ **Normal** for local development
- ✅ **Solution**: Click "Advanced" → "Proceed to site"
- ✅ **Alternative**: Use `npm run dev:tunnel` for valid SSL

### Environment ID Not Found
1. Check `.env` file configuration
2. Ensure variables start with `VITE_`
3. Restart development server
4. Verify Environment ID from Kontent.ai

## 📝 Scripts Reference

```bash
npm run dev          # HTTP development server
npm run dev:secure   # HTTPS development (Kontent.ai ready)
npm run dev:tunnel   # Public tunnel via ngrok
npm run dev:netlify  # Production environment simulation
npm run build        # Production build
npm run preview      # Preview production build
npm run format       # Code formatting with Biome
npm run format:fix   # Auto-fix formatting issues
```

## 🔗 Dependencies

- **[@kontent-ai/custom-app-sdk](https://github.com/kontent-ai/custom-app-sdk-js)**: Kontent.ai integration
- **[@kontent-ai/delivery-sdk](https://github.com/kontent-ai/delivery-sdk-js)**: Official Delivery API SDK
- **[Vite](https://vitejs.dev/)**: Build tool and development server
- **[TypeScript](https://www.typescriptlang.org/)**: Type safety
- **[Biome](https://biomejs.dev/)**: Linting and formatting

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Ready to find duplicate slugs in your Kontent.ai project!** 🔍