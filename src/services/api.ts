/**
 * Kontent.ai API service using the official Delivery SDK
 */

import { createDeliveryClient, type IContentItem, type Elements } from "@kontent-ai/delivery-sdk";
import { appConfig, isConfigValid } from "../config";
import type { ApiResult, ContentItem } from "../types";

// Type for page content items with slug fields
type PageItem = IContentItem<{
  url_slug?: Elements.UrlSlugElement;
  slug?: Elements.UrlSlugElement;
}>;

// Languages to search explicitly
const LANGUAGE_CODES = ["de", "en", "zh"];

/**
 * Create delivery client instance
 */
function createClient() {
  return createDeliveryClient({
    environmentId: appConfig.projectId,
    secureApiKey: appConfig.deliveryApiKey || undefined,
  });
}

/**
 * Search for items with specific slug using the Delivery SDK
 */
export async function searchWithDeliveryApi(targetSlug: string): Promise<ApiResult> {
  if (!isConfigValid()) {
    return createErrorResult("Missing Kontent.ai Project ID configuration.", "delivery-sdk");
  }

  try {
    console.log(`\n--- Delivery SDK Search for "${targetSlug}" ---`);
    const client = createClient();
    const allItems: ContentItem[] = [];

    for (const lang of LANGUAGE_CODES) {
      console.log(`Searching in language: ${lang}`);
      
      // Try searching with url_slug field
      try {
        const response = await client
          .items<PageItem>()
          .type('page')
          .equalsFilter('elements.url_slug', targetSlug)
          .languageParameter(lang)
          .toAllPromise(); // Automatically handles pagination!

        const items = response.data.items.map(item => formatSDKItem(item, lang));
        allItems.push(...items);
        console.log(`Found ${items.length} items with url_slug in ${lang}`);
      } catch (error) {
        console.log(`No items found with url_slug in ${lang}:`, error);
      }

      // Try searching with slug field  
      try {
        const response = await client
          .items<PageItem>()
          .type('page')
          .equalsFilter('elements.slug', targetSlug)
          .languageParameter(lang)
          .toAllPromise(); // Automatically handles pagination!

        const items = response.data.items.map(item => formatSDKItem(item, lang));
        allItems.push(...items);
        console.log(`Found ${items.length} items with slug in ${lang}`);
      } catch (error) {
        console.log(`No items found with slug in ${lang}:`, error);
      }
    }

    // Remove duplicates based on codename+language
    const uniqueItems = removeDuplicateItems(allItems);

    return {
      success: true,
      items: uniqueItems,
      method: "delivery-sdk",
      totalItems: uniqueItems.length,
    };
  } catch (error: unknown) {
    console.error("Delivery SDK search error:", error);
    return createErrorResult(
      error instanceof Error ? error.message : String(error),
      "delivery-sdk"
    );
  }
}

/**
 * Search all items for analysis using the Delivery SDK  
 */
export async function searchAllItemsDeliveryApi(targetSlug: string): Promise<ApiResult> {
  if (!isConfigValid()) {
    return createErrorResult("Missing Kontent.ai Project ID configuration.", "delivery-sdk-all");
  }

  try {
    console.log(`\n--- Delivery SDK All Items Search ---`);
    const client = createClient();
    const allItems: ContentItem[] = [];

    for (const lang of LANGUAGE_CODES) {
      console.log(`Fetching all page items in language: ${lang}`);
      
      const response = await client
        .items<PageItem>()
        .type('page')
        .languageParameter(lang)
        .elementsParameter(['url_slug', 'slug'])
        .toAllPromise(); // SDK handles pagination automatically!

      const items = response.data.items
        .filter(item => 
          item.elements.url_slug?.value || item.elements.slug?.value
        )
        .map(item => formatSDKItem(item, lang));

      allItems.push(...items);
      console.log(`Fetched ${items.length} page items with slugs in ${lang}`);
    }

    // Analyze slug data
    const allSlugs = [...new Set(allItems.map(item => item.slug))];
    const exactMatches = allItems.filter(item => item.slug === targetSlug);
    const similarSlugs = allSlugs.filter(slug => 
      slug?.toLowerCase().includes(targetSlug.toLowerCase())
    );

    console.log(`Total unique slugs: ${allSlugs.length}`);
    console.log(`Exact matches for "${targetSlug}": ${exactMatches.length}`);
    console.log(`Similar slugs:`, similarSlugs.slice(0, 10)); // Show first 10

    return {
      success: true,
      items: exactMatches,
      method: "delivery-sdk-all",
      totalItems: allItems.length,
      exactMatches: exactMatches.length,
      allSlugsCount: allSlugs.length,
      similarSlugs: similarSlugs.slice(0, 20), // Limit to first 20
    };
  } catch (error: unknown) {
    console.error("Delivery SDK all items search error:", error);
    return createErrorResult(
      error instanceof Error ? error.message : String(error),
      "delivery-sdk-all"
    );
  }
}

/**
 * Management API search (placeholder - would need Management SDK)
 */
export async function searchWithManagementApi(targetSlug: string): Promise<ApiResult> {
  console.log(`\n--- Management API Search (Not implemented) ---`);
  console.log(`Would search for: ${targetSlug}`);
  
  return {
    success: true,
    items: [],
    method: "management-api",
    note: "Management API integration would require @kontent-ai/management-sdk for full implementation",
  };
}

/**
 * Format SDK item to our ContentItem interface
 */
function formatSDKItem(item: PageItem, language: string): ContentItem {
  const slugValue = item.elements.url_slug?.value || item.elements.slug?.value || "No slug";
  const slugField = item.elements.url_slug?.value ? "url_slug" : "slug";

  return {
    name: item.system.name || "Unknown",
    codename: item.system.codename || "Unknown",  
    type: item.system.type || "page",
    language: language,
    slug: slugValue,
    slugField: slugField,
  };
}

/**
 * Remove duplicate items based on codename+language combination
 */
function removeDuplicateItems(items: ContentItem[]): ContentItem[] {
  return items.filter(
    (item, index, self) =>
      index === self.findIndex((i) => 
        i.codename === item.codename && i.language === item.language
      ),
  );
}

/**
 * Create error result object
 */
function createErrorResult(message: string, method: string): ApiResult {
  return {
    success: false,
    items: [],
    error: message,
    method,
  };
}