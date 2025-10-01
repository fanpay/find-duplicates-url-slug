src/

# Kontent.ai Duplicate Slug Finder – Project Overview

This application is currently implemented as a single-file TypeScript SPA. All logic—including configuration, API calls, business logic, and UI rendering—is contained in `src/main.ts`.

## 📁 Project Structure

```
src/
└── main.ts   # Application entry point and all logic
```

## 📝 Current Architecture

- All configuration, event handling, API integration, business logic, and UI rendering are implemented in `main.ts`.
- No modular separation (no `types/`, `config/`, `utils/`, `services/`, or `components/` folders).
- The code is organized with clear function boundaries and comments, but all features reside in a single file.

## 🚦 How It Works

1. **Configuration**: Reads environment variables and, if embedded, uses the Kontent.ai Custom App SDK to get context.
2. **API Integration**: Fetches content items from the Kontent.ai Delivery API, handling pagination to process all items.
3. **Business Logic**: Detects duplicate slugs among content items of type `page`.
4. **UI Rendering**: Updates the DOM directly to show configuration, context, search results, and duplicate analysis.
5. **Debugging**: Includes debug buttons and console logs for troubleshooting.

## 🛠️ Adding Features

To add new features, extend `main.ts` with new functions for configuration, API calls, business logic, or UI rendering as needed. Keep related logic grouped and well-commented.

### New (Slug Search Input)

The interface now includes a text input where you can type any slug and search for matching pages. Press Enter or click "Search Slug". This replaces the previous hardcoded test slug.

## 🔄 Migration to Modular Architecture

If you wish to migrate to a modular architecture (as described in the previous version of this README), follow these steps:

1. **Extract Types**: Move all TypeScript interfaces and type definitions to `src/types/index.ts`.
2. **Extract Configuration**: Move environment/context/config logic to `src/config/index.ts`.
3. **Extract Utilities**: Move pure helper functions to `src/utils/index.ts`.
4. **Extract API Services**: Move API request logic to `src/services/api.ts`.
5. **Extract Business Logic**: Move search/duplicate logic to `src/services/search.ts`.
6. **Extract UI Components**: Move rendering functions to `src/components/ui.ts`.
7. **Refactor Main**: Keep only orchestration and event handling in `main.ts`.

This migration will improve maintainability, testability, and scalability.

## ⚠️ Note

The current codebase is monolithic for simplicity and rapid prototyping. Modularization is recommended for larger or long-term projects.