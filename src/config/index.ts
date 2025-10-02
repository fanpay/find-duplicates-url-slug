/**
 * Configuration management for Kontent.ai environment and API keys
 */

import { getCustomAppContext } from "@kontent-ai/custom-app-sdk";
import type { AppConfig } from "../types";

// Global configuration instance
export const appConfig: AppConfig = {
  environmentId: "",
  deliveryApiKey: "",
  managementApiKey: "",
  languages: [],
  defaultLanguage: "en"
};

/**
 * Initialize configuration from environment variables and Kontent.ai context
 */
export async function initializeConfig(): Promise<void> {
  // Get environment variables as fallback (mainly for standalone testing)
  appConfig.environmentId = getEnvVar("VITE_KONTENT_ENVIRONMENT_ID") || "";
  
  // Configure languages from environment variables
  const envLanguages = getEnvVar("VITE_KONTENT_LANGUAGES");
  if (envLanguages) {
    appConfig.languages = envLanguages.split(",").map(lang => lang.trim());
  }
  
  const envDefaultLanguage = getEnvVar("VITE_KONTENT_DEFAULT_LANGUAGE");
  if (envDefaultLanguage) {
    appConfig.defaultLanguage = envDefaultLanguage.trim();
  }

  console.log("🔧 Environment variables loaded:", {
    hasEnvironmentId: Boolean(appConfig.environmentId)
  });

  // Try to get context from Kontent.ai Custom App SDK (preferred source)
  try {
    console.log("🔍 Attempting to get Custom App context...");
    const ctx = await getCustomAppContext();
    console.log("📋 Custom App Context response:", ctx);

    if (!ctx.isError && ctx.context?.environmentId) {
      // Use Environment ID from Kontent.ai context (preferred and most reliable)
      appConfig.environmentId = ctx.context.environmentId;
      console.log("✅ Using Environment ID from Kontent.ai context:", appConfig.environmentId);
    } else {
      console.log("⚠️ Custom App context not available or incomplete");
    }
  } catch (error) {
    console.log("❌ Could not get Custom App context:", error);
    console.log("📝 This is normal when testing outside Kontent.ai iframe");
  }

  logConfiguration();
}

/**
 * Get the configured languages or fallback to default
 */
export function getConfiguredLanguages(): string[] {
  if (appConfig.languages && appConfig.languages.length > 0) {
    return appConfig.languages;
  }
  // Fallback to default language if no languages configured
  return [appConfig.defaultLanguage || "en"];
}

/**
 * Get environment variable from multiple sources
 */
declare global {
  // Vite injects env vars prefixed with VITE_
  interface ImportMetaEnv {
    readonly VITE_KONTENT_ENVIRONMENT_ID?: string;
    readonly VITE_KONTENT_LANGUAGES?: string;
    readonly VITE_KONTENT_DEFAULT_LANGUAGE?: string;
    // Allow other arbitrary variables without forcing any
    readonly [key: string]: string | undefined;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

function getEnvVar(key: string): string {
  // In Vite, only use import.meta.env (not process.env in the browser)
  return import.meta.env?.[key] || "";
}

/**
 * Log current configuration (without exposing sensitive data)
 */
function logConfiguration(): void {
  console.log("📋 Final configuration:", {
    environmentId: appConfig.environmentId || "❌ NOT SET",
    languages: appConfig.languages?.length ? appConfig.languages : ["Using default: " + appConfig.defaultLanguage],
    defaultLanguage: appConfig.defaultLanguage,
  });
}

/**
 * Check if required configuration is present
 */
export function isConfigValid(): boolean {
  return Boolean(appConfig.environmentId);
}

/**
 * Get configuration status for display
 */
export function getConfigStatus(): {
  environmentId: string;
} {
  return {
    environmentId: appConfig.environmentId,
  };
}
