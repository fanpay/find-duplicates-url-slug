/**
 * Kontent.ai API service for content item operations
 */

import { appConfig, isConfigValid } from "../config";
import type { ApiResult, PaginationInfo } from "../types";
import type { RawKontentItem } from "../utils";
import {
  countItemsByFieldType,
  createApiHeaders,
  createSearchConfigs,
  filterItemsBySlug,
  filterPageItemsWithSlugs,
  findSimilarSlugs,
  formatItem,
  getUniqueSlugValues,
  logItemDetails,
} from "../utils";

const KONTENT_DELIVERY_API_BASE = "https://deliver.kontent.ai";
const KONTENT_MANAGEMENT_API_BASE = "https://manage.kontent.ai/v2";

// Languages to search explicitly
const LANGUAGE_CODES = ["de", "en", "zh"];

/**
 * Search for items with specific slug using direct API filtering
 */
export async function searchWithDeliveryApi(targetSlug: string): Promise<ApiResult> {
  if (!isConfigValid()) {
    return createErrorResult("Missing Kontent.ai Project ID configuration.", "delivery-api-direct");
  }

  try {
    console.log("\n--- Delivery API Direct Search ---");
    const headers = createApiHeaders(appConfig.deliveryApiKey);
    const searchConfigs = createSearchConfigs(targetSlug);
    const aggregatedItems = await fetchDirectSearchItems(searchConfigs, headers, targetSlug);

    if (aggregatedItems.length > 0) {
      console.log(
        `✅ Found ${aggregatedItems.length} items across languages [${LANGUAGE_CODES.join(", ")}]`,
      );
      return {
        success: true,
        items: aggregatedItems.map(formatItem),
        method: "delivery-api-direct",
        field: "multi-language",
      };
    }

    return { success: false, items: [], method: "delivery-api-direct" };
  } catch (error: unknown) {
    console.error("Delivery API direct search error:", error);
    return createErrorResult(
      error instanceof Error ? error.message : String(error),
      "delivery-api-direct",
    );
  }
}

export async function searchAllItemsDeliveryApi(targetSlug: string): Promise<ApiResult> {
  if (!isConfigValid()) {
    return createErrorResult(
      "Missing Kontent.ai Project ID configuration.",
      "delivery-api-all-items",
    );
  }

  try {
    console.log("\n--- Delivery API All Items Search ---");
    const headers = createApiHeaders(appConfig.deliveryApiKey);

    const allItems = await fetchAllPageItems(headers);
    const analysisResult = analyzeSlugData(allItems, targetSlug);

    return {
      success: true,
      items: analysisResult.matchingItems.map(formatItem),
      method: "delivery-api-all-items",
      ...analysisResult.stats,
    };
  } catch (error: unknown) {
    console.error("Delivery API all items search error:", error);
    return createErrorResult(
      error instanceof Error ? error.message : String(error),
      "delivery-api-all-items",
    );
  }
}

async function fetchDirectSearchItems(
  searchConfigs: ReturnType<typeof createSearchConfigs>,
  headers: Record<string, string>,
  targetSlug: string,
): Promise<RawKontentItem[]> {
  let aggregated: RawKontentItem[] = [];
  for (const lang of LANGUAGE_CODES) {
    for (const config of searchConfigs) {
      const params = new URLSearchParams(config.params);
      params.set("language", lang);
      const url = `${KONTENT_DELIVERY_API_BASE}/${appConfig.projectId}/items?${params.toString()}`;
      console.log(`Trying URL (${config.field} field, lang=${lang}):`, url);
      const res = await fetch(url, { headers });
      console.log(`Response status for ${config.field} field (lang=${lang}):`, res.status);
      if (!res.ok) {
        console.log(
          `❌ Failed with ${config.field} field (lang=${lang}):`,
          res.status,
          res.statusText,
        );
        continue;
      }
      const data = await res.json();
      console.log(`Response data for ${config.field} (lang=${lang}):`, {
        itemCount: data.items?.length || 0,
        pagination: data.pagination,
      });
      const items = filterItemsBySlug(data.items || [], targetSlug);
      aggregated = aggregated.concat(items);
      for (const item of data.items || []) {
        logItemDetails(item, targetSlug);
      }
    }
  }
  return aggregated;
}

/**
 * Search using Management API (placeholder for future implementation)
 */
export async function searchWithManagementApi(targetSlug: string): Promise<ApiResult> {
  if (!isConfigValid()) {
    return createErrorResult("Missing Kontent.ai Project ID configuration.", "management-api");
  }

  try {
    console.log("\n--- Management API Search ---");
    const headers = createApiHeaders(appConfig.managementApiKey);

    const url = `${KONTENT_MANAGEMENT_API_BASE}/projects/${appConfig.projectId}/items`;
    console.log("Management API URL:", url);

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Management API Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Management API response:", data);

    return {
      success: true,
      items: [], // Would need additional processing for language variants
      method: "management-api",
      note: "Management API integration needs additional implementation for language variants",
    };
  } catch (error: unknown) {
    console.error("Management API search error:", error);
    return createErrorResult(
      error instanceof Error ? error.message : String(error),
      "management-api",
    );
  }
}

/**
 * Fetch all page items with pagination
 */
async function fetchAllPageItems(headers: Record<string, string>): Promise<RawKontentItem[]> {
  let allItems: RawKontentItem[] = [];

  for (const lang of LANGUAGE_CODES) {
    const pagination: PaginationInfo = {
      skip: 0,
      pageSize: 1000,
      totalRequests: 0,
      more: true,
    };

    while (pagination.more) {
      pagination.totalRequests++;
      const url = `${KONTENT_DELIVERY_API_BASE}/${appConfig.projectId}/items?system.type=page&elements=url_slug,slug,system&limit=${pagination.pageSize}&skip=${pagination.skip}&language=${lang}`;

      console.log(`Request ${pagination.totalRequests} (lang=${lang}): ${url}`);

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log(`API Response pagination (lang=${lang}):`, data.pagination);

      const newItems = filterPageItemsWithSlugs((data.items || []) as RawKontentItem[]);
      allItems = allItems.concat(newItems);

      console.log(
        `Request ${pagination.totalRequests} (lang=${lang}): Fetched ${newItems.length} page items with slugs, running total: ${allItems.length}`,
      );
      console.log(`Raw items in this batch (lang=${lang}): ${data.items?.length || 0}`);

      // Update pagination
      if (data.pagination?.next_page) {
        pagination.skip += pagination.pageSize;
        console.log(`More items available, next skip (lang=${lang}): ${pagination.skip}`);
      } else {
        console.log(`No more pages available (lang=${lang})`);
        pagination.more = false;
      }

      // Safety check
      if (pagination.totalRequests > 50) {
        console.log("Safety limit reached (50 requests), stopping");
        break;
      }
    }
  }

  console.log(`\n=== PAGINATION COMPLETE (langs: ${LANGUAGE_CODES.join(", ")}) ===`);
  console.log(`Total page items with slugs: ${allItems.length}`);

  return allItems;
}

/**
 * Analyze slug data and find matches
 */
function analyzeSlugData(allItems: RawKontentItem[], targetSlug: string) {
  const allSlugs = getUniqueSlugValues(allItems);
  const fieldCounts = countItemsByFieldType(allItems);

  console.log(`Total unique slugs: ${allSlugs.length}`);
  console.log("First 20 slugs:", allSlugs.slice(0, 20));
  console.log(`Items with url_slug field: ${fieldCounts.urlSlugCount}`);
  console.log(`Items with slug field: ${fieldCounts.slugCount}`);

  // Find matches
  const exactMatches = allSlugs.filter((slug) => slug === targetSlug);
  const similarSlugs = findSimilarSlugs(allSlugs, targetSlug);
  //const meliSlugs = findSimilarSlugs(allSlugs, "meli");

  console.log(`Exact slug matches for "${targetSlug}": ${exactMatches.length}`);
  console.log("Similar slugs (containing target):", similarSlugs);
  //console.log('All slugs containing "meli":', meliSlugs);

  // Find matching items
  const matchingItems = allItems.filter((item) => {
    const slugValue = item.elements?.url_slug?.value || item.elements?.slug?.value;
    return slugValue === targetSlug;
  });

  // Case-insensitive matches
  const caseInsensitiveMatches = allItems.filter((item) => {
    const slugValue = item.elements?.url_slug?.value || item.elements?.slug?.value;
    return slugValue && slugValue.toLowerCase() === targetSlug.toLowerCase();
  });

  console.log(`Found ${matchingItems.length} items with exact slug "${targetSlug}"`);
  console.log(`Found ${caseInsensitiveMatches.length} items with case-insensitive slug match`);

  return {
    matchingItems,
    stats: {
      totalItems: allItems.length,
      totalRequests: 0, // Will be set by caller
      exactMatches: exactMatches.length,
      similarSlugs,
      //meliSlugs,
      caseInsensitiveMatches: caseInsensitiveMatches.length,
      allSlugsCount: allSlugs.length,
    },
  };
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
