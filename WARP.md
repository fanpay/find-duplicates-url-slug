# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Kontent.ai custom application that finds duplicate URL slugs across pages in a Kontent.ai environment. Built with TypeScript, Vite, and designed for deployment on Netlify.

## Development Commands

### Local Development
```bash
npm run dev                    # Start Vite dev server
npm run dev:functions         # Start Netlify dev server with functions support
npm run dev:functions:live    # Start Netlify dev server with live tunnel
```

### Build & Deploy
```bash
npm run build     # Build TypeScript and bundle with Vite
npm run preview   # Preview production build locally
```

### Code Quality
```bash
npx biome check   # Run Biome linter/formatter
npx biome format  # Format code with Biome
```

## Architecture

### Core Structure
- **Frontend**: Single-page application built with vanilla TypeScript and Vite
- **Custom App SDK**: Uses `@kontent-ai/custom-app-sdk` to integrate with Kontent.ai environment
- **Management SDK**: Uses `@kontent-ai/management-sdk` for API interactions
- **Deployment**: Configured for Netlify with SPA redirect rules

### Key Files
- `src/main.ts` - Refactored main application with modular architecture
- `index.html` - Simple HTML entry point for the SPA
- `netlify.toml` - Netlify deployment configuration
- `tsconfig.json` - TypeScript configuration with path aliases

### Modular Code Architecture
The application is now broken down into separate modules for better maintainability:

**Core Files:**
- `src/main.ts` - Application entry point and orchestration
- `src/types/index.ts` - TypeScript interface definitions
- `src/config/index.ts` - Configuration and environment management
- `src/utils/index.ts` - Utility functions and data manipulation
- `src/services/api.ts` - Kontent.ai API integration layer
- `src/services/search.ts` - Search operations and business logic
- `src/components/ui.ts` - UI components and rendering functions

**Module Responsibilities:**
1. **Types** - All TypeScript interfaces and type definitions
2. **Config** - Environment variables, API keys, and configuration management
3. **Utils** - Pure utility functions for data manipulation and formatting
4. **Services/API** - Direct Kontent.ai API interactions and HTTP requests
5. **Services/Search** - Business logic for search operations and duplicate detection
6. **Components/UI** - UI rendering, styling, and display logic
7. **Main** - Application bootstrap, event handling, and module coordination

### Data Flow
1. Application initializes UI and loads configuration
2. Attempts to get Kontent.ai context via Custom App SDK
3. Falls back to environment variables for project ID and API keys
4. Uses multiple search strategies: direct API filtering and fetch-all-and-filter
5. Handles both 'slug' and 'url_slug' field names automatically
6. Groups items by slug and identifies duplicates with comprehensive statistics
7. Displays results with detailed debug information

## Environment Configuration

### Required Environment Variables
- `VITE_KONTENT_PROJECT_ID` - Kontent.ai project/environment ID
- `VITE_KONTENT_API_KEY` - Optional API key for secured environments

### Kontent.ai Integration
- The app automatically detects the environment ID when running within Kontent.ai
- Uses Delivery API with pagination to handle large datasets
- Filters for page content types with url_slug elements

## TypeScript Configuration

- Target: ESNext with modern module resolution
- Path aliases: `@/*` maps to `src/*`
- Includes both source files and potential Netlify functions
- Strict mode enabled for better type safety

## Build System

- **Bundler**: Vite for fast development and optimized production builds
- **Output**: Static files to `dist/` directory
- **SPA Support**: Netlify redirects handle client-side routing
- **TypeScript**: Compiled before bundling for type checking

## Development Notes

### Modular Architecture Benefits
- **Type Safety**: Strong TypeScript interfaces for all data structures
- **Separation of Concerns**: Clear separation between UI, API, and business logic
- **Maintainability**: Functions are focused and single-purpose
- **Extensibility**: Easy to add new search strategies or UI components

### API Integration
- Handles both 'slug' and 'url_slug' field names automatically
- Uses multiple search strategies: direct filtering and fetch-all-and-filter
- Comprehensive pagination with safety limits (50 requests max)
- Robust error handling for network failures and configuration issues

### User Interface
- Modern CSS with semantic class names
- Responsive design with clean typography
- Color-coded status indicators (success/warning/error)
- Detailed debug information for troubleshooting

### Adding New Features
With the modular architecture, adding features is more structured:

1. **New API Integration**: Add functions to `src/services/api.ts`
2. **New Search Logic**: Add functions to `src/services/search.ts`
3. **New UI Component**: Add rendering functions to `src/components/ui.ts`
4. **New Button/Action**: Update `src/main.ts` event handlers and `src/components/ui.ts`
5. **New Data Types**: Add interfaces to `src/types/index.ts`
6. **New Configuration**: Update `src/config/index.ts`
7. **New Utilities**: Add helper functions to `src/utils/index.ts`

### Module Dependencies
- `main.ts` → imports from all modules
- `services/` → depends on `config`, `utils`, `types`
- `components/` → depends on `config`, `types`
- `utils/` → depends only on `types`
- `config/` → depends only on `types`
- `types/` → no dependencies (pure type definitions)

### Best Practices for Modifications
- **Keep modules focused**: Each module should have a single responsibility
- **Avoid circular dependencies**: Follow the dependency hierarchy
- **Use TypeScript interfaces**: Define types before implementing features
- **Pure functions in utils**: Keep utility functions side-effect free
- **Centralize configuration**: All environment variables in `config/`
- **Separate concerns**: Keep API logic separate from business logic

### Performance
- Efficient pagination with proper continuation tokens
- Client-side deduplication to avoid redundant API calls
- Comprehensive logging for performance monitoring
- Uses modern fetch API with proper header management
