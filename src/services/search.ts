/**
 * Search service using the Delivery SDK for finding duplicate slugs
 */

import { createDeliveryClient, type IContentItem, type Elements } from "@kontent-ai/delivery-sdk";
import { appConfig, isConfigValid, getConfiguredLanguages } from "../config";
import type { ApiResult, DuplicateResult } from "../types";
import { searchAllItemsDeliveryApi, searchWithDeliveryApi, searchWithManagementApi } from "./api";

// Type for page content items
type PageItem = IContentItem<{
  url_slug?: Elements.UrlSlugElement;
  slug?: Elements.UrlSlugElement;
}>;

/**
 * Search for items with specific slug using multiple approaches
 */
export async function searchSpecificSlug(targetSlug: string): Promise<ApiResult> {
  if (!isConfigValid()) {
    return {
      success: false,
      items: [],
      error: 'Missing Kontent.ai Project ID configuration. Click "Show Config" to verify settings.',
      method: "none",
    };
  }

  try {
    console.log(`\n=== SEARCHING FOR SLUG: "${targetSlug}" (ALL LANGUAGES) ===`);

    // Try multiple approaches using the SDK
    const results = {
      deliveryApi: await searchWithDeliveryApi(targetSlug),
      deliveryApiAllItems: await searchAllItemsDeliveryApi(targetSlug), 
      managementApi: appConfig.managementApiKey ? await searchWithManagementApi(targetSlug) : null,
    };

    console.log("All search results:", results);

    // Combine all results
    const allItems = [
      ...(results.deliveryApi.items || []),
      ...(results.deliveryApiAllItems.items || []),
      ...(results.managementApi?.items || []),
    ];

    // Remove duplicates based on codename+language
    const uniqueItems = removeDuplicateItems(allItems);

    return {
      success: true,
      items: uniqueItems,
      method: "combined-sdk",
      deliveryApi: results.deliveryApi,
      deliveryApiAllItems: results.deliveryApiAllItems,
      managementApi: results.managementApi,
      totalItems: uniqueItems.length,
    } as ApiResult;
  } catch (err: unknown) {
    return {
      success: false,
      items: [],
      error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      method: "error",
    };
  }
}

/**
 * Find duplicate slugs across all content items using SDK
 * @param languages Optional array of language codes to search. If not provided, uses configured languages or default language
 */
export async function findDuplicateSlugs(languages?: string[]): Promise<DuplicateResult> {
  if (!isConfigValid()) {
    return {
      duplicates: [],
      error: 'Missing Kontent.ai Project ID configuration. Click "Show Config" to verify settings.',
    };
  }

  try {
    const languagesToSearch = languages || getConfiguredLanguages();
    console.log(`\n=== FINDING DUPLICATE SLUGS USING SDK (${languagesToSearch.join(", ")}) ===`);
    
    const allItems = await fetchAllPageItemsWithSlugs(languagesToSearch);
    const slugMap = buildSlugMap(allItems);
    const duplicates = findTrueDuplicates(slugMap);

    logDuplicateResults(duplicates);

    return {
      duplicates,
      totalItems: allItems.length,
      uniqueSlugs: slugMap.size,
    };
  } catch (err: unknown) {
    console.error("Duplicate search error:", err);
    return {
      duplicates: [],
      error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Fetch all page items with slugs across all languages
 */
async function fetchAllPageItemsWithSlugs(languages?: string[]): Promise<PageItem[]> {
  const client = createDeliveryClient({
    environmentId: appConfig.projectId,
    secureApiKey: appConfig.deliveryApiKey || undefined,
  });

  // Use provided languages or get configured languages
  const languagesToSearch = languages || getConfiguredLanguages();
  console.log(`🌐 Languages to search: ${languagesToSearch.join(", ")}`);

  const allItems: PageItem[] = [];
  
  for (const lang of languagesToSearch) {
    console.log(`Fetching page items in language: ${lang}`);
    
    const response = await client
      .items<PageItem>()
      .type('page')
      .languageParameter(lang)
      .elementsParameter(['url_slug', 'slug'])
      .toAllPromise();

    const itemsWithSlugs = response.data.items.filter(item => 
      item.elements.url_slug?.value || item.elements.slug?.value
    );

    allItems.push(...itemsWithSlugs);
    console.log(`Fetched ${itemsWithSlugs.length} page items with slugs in ${lang}`);
  }

  console.log(`Total page items with slugs: ${allItems.length}`);
  return allItems;
}

/**
 * Build a map of slugs to their associated items
 */
function buildSlugMap(items: PageItem[]): Map<string, Array<{
  name: string;
  codename: string;
  language: string;
  slugField: string;
}>> {
  const slugMap = new Map<string, Array<{
    name: string;
    codename: string;
    language: string;
    slugField: string;
  }>>();

  for (const item of items) {
    const slug = item.elements.url_slug?.value || item.elements.slug?.value;
    if (!slug) continue;

    if (!slugMap.has(slug)) {
      slugMap.set(slug, []);
    }
    
    slugMap.get(slug)?.push({
      name: item.system.name || "Unknown",
      codename: item.system.codename || "unknown",
      language: item.system.language || "unknown",
      slugField: item.elements.url_slug?.value ? "url_slug" : "slug",
    });
  }

  return slugMap;
}

/**
 * Find true duplicates from slug map
 */
function findTrueDuplicates(slugMap: Map<string, Array<{
  name: string;
  codename: string;
  language: string;
  slugField: string;
}>>) {
  return Array.from(slugMap.entries())
    .filter(([, items]) => {
      const uniqueCodenames = new Set(items.map(item => item.codename));
      return uniqueCodenames.size > 1;
    })
    .map(([slug, items]) => ({
      slug,
      items: groupItemsByCodename(items),
    }));
}

/**
 * Group items by codename for better display
 */
function groupItemsByCodename(items: Array<{
  name: string;
  codename: string;
  language: string;
  slugField: string;
}>) {
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.codename]) {
      acc[item.codename] = [];
    }
    acc[item.codename].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return Object.entries(grouped).map(([codename, languageItems]) => ({
    name: languageItems[0].name,
    codename,
    language: languageItems.map(item => item.language).join(", "),
    slugField: languageItems[0].slugField as "url_slug" | "slug",
  }));
}

/**
 * Log duplicate results for debugging
 */
function logDuplicateResults(duplicates: ReturnType<typeof findTrueDuplicates>): void {
  console.log(`Found ${duplicates.length} TRUE duplicate slugs`);
  for (const d of duplicates) {
    console.log(`- Slug "${d.slug}": ${d.items.length} different content items`);
    for (const item of d.items) {
      console.log(`  * ${item.name} (${item.codename}) - Languages: ${item.language}`);
    }
  }
}

/**
 * Remove duplicate items based on codename+language combination
 */
function removeDuplicateItems<T extends { codename: string; language: string }>(items: T[]): T[] {
  return items.filter(
    (item, index, self) =>
      index === self.findIndex((i) => 
        i.codename === item.codename && i.language === item.language
      ),
  );
}