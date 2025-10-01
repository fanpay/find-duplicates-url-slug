/**
 * Search service for finding duplicate slugs and specific items
 */

import { appConfig, isConfigValid } from "../config";
import type { ApiResult, DuplicateItem, DuplicateResult } from "../types";
import type { DuplicateGroup, DuplicateSummaryItem, RawKontentItem } from "../utils";
import {
  createApiHeaders,
  filterDuplicates,
  filterPageItemsWithSlugs,
  groupItemsBySlug,
  removeDuplicateItems,
} from "../utils";
import { searchAllItemsDeliveryApi, searchWithDeliveryApi, searchWithManagementApi } from "./api";

// Languages to search explicitly
const LANGUAGE_CODES = ["de", "en", "zh"];

/**
 * Search for items with specific slug using multiple API approaches
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

    // Try multiple API endpoints and approaches
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

    // Remove duplicates based on codename+language combination to preserve multilingual variants
    const uniqueItems = removeDuplicateItems(allItems);

    return {
      success: true,
      items: uniqueItems,
      method: "combined",
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
 * Find duplicate slugs across all content items
 */
export async function findDuplicateSlugs(): Promise<DuplicateResult> {
  if (!isConfigValid()) {
    return {
      duplicates: [],
      error: 'Missing Kontent.ai Project ID configuration. Click "Show Config" to verify settings.',
    };
  }

  try {
    console.log("\n=== FINDING DUPLICATE SLUGS (ALL LANGUAGES) ===");

    const headers = createApiHeaders(appConfig.deliveryApiKey);
    const { allItems, slugMap, duplicates } = await performDuplicateComputation(headers);
    logDuplicateSummary(allItems.length, slugMap.size, duplicates);

    // Adapt DuplicateGroup (with aggregated language data) to DuplicateItem expected by types
    const duplicateItems: DuplicateItem[] = duplicates.map((d) => ({
      slug: d.slug,
      items: d.items.map((i) => ({
        name: i.name,
        codename: i.codename,
        language: i.language, // aggregated representative language string
        slugField: i.slugField === "url_slug" ? "url_slug" : "slug",
      })),
    }));

    return {
      duplicates: duplicateItems,
      totalItems: allItems.length,
      totalRequests: 0, // Will be updated by fetchAllPageItemsForDuplicateCheck
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
 * Internal: perform the heavy lifting for duplicate computation
 */
async function performDuplicateComputation(headers: Record<string, string>) {
  const allItems = await fetchAllPageItemsForDuplicateCheck(headers);
  console.log("\n=== DUPLICATE ANALYSIS ===");
  console.log(`Total page items with slugs: ${allItems.length}`);
  const slugMap = groupItemsBySlug(allItems);
  const duplicates = filterDuplicates(slugMap);
  return { allItems, slugMap, duplicates };
}

/**
 * Internal: log summary & per-duplicate detail
 */
function logDuplicateSummary(
  totalItems: number,
  uniqueSlugs: number,
  duplicates: DuplicateGroup[],
) {
  console.log("\n=== DUPLICATE ANALYSIS RESULTS ===");
  console.log(
    `Found ${duplicates.length} TRUE duplicate slugs (different content items sharing same slug)`,
  );
  for (const d of duplicates) {
    const contentItems = d.items.length;
    const totalVariants = d.items.reduce(
      (sum: number, item: DuplicateSummaryItem) => sum + (item.languageCount || 1),
      0,
    );
    console.log(
      `\n- Slug "${d.slug}": ${contentItems} different content items, ${totalVariants} total language variants`,
    );
    for (const item of d.items) {
      const languages = item.languages ? item.languages.join(", ") : item.language;
      console.log(`  * ${item.name} (${item.codename}) - Languages: [${languages}]`);
    }
    if (d.slug === "lorem-ipsum") {
      console.log(
        "  🔍 LOREM-IPSUM DEBUG - This shows different content items sharing the same slug:",
      );
      for (const item of d.items) {
        console.log(
          `    - Content Item: ${item.name} (${item.codename}) in languages: [${item.languages ? item.languages.join(", ") : item.language}]`,
        );
      }
    }
  }
}

/**
 * Fetch all page items for duplicate checking with pagination
 */
async function fetchAllPageItemsForDuplicateCheck(
  headers: Record<string, string>,
): Promise<RawKontentItem[]> {
  const allItems: RawKontentItem[] = [];
  for (const lang of LANGUAGE_CODES) {
    const itemsForLang = await fetchItemsForLanguage(lang, headers);
    allItems.push(...itemsForLang);
  }
  console.log(`Total requests made across all languages: ${LANGUAGE_CODES.length}`);
  console.log(`Total items across all languages: ${allItems.length}`);
  return allItems;
}

async function fetchItemsForLanguage(
  lang: string,
  headers: Record<string, string>,
): Promise<RawKontentItem[]> {
  let items: RawKontentItem[] = [];
  let skip = 0;
  const pageSize = 1000;
  let more = true;
  let totalRequests = 0;
  while (more) {
    totalRequests++;
    const url = `https://deliver.kontent.ai/${appConfig.projectId}/items?system.type=page&elements=url_slug,slug,system&limit=${pageSize}&skip=${skip}&language=${lang}`;
    console.log(`Duplicate search request ${totalRequests} (lang=${lang}): ${url}`);
    const data = await fetchItemsPage(url, headers);
    const newItems = filterPageItemsWithSlugs((data.items || []) as RawKontentItem[]);
    items = items.concat(newItems);
    logBatchInfo(lang, totalRequests, newItems, items.length);
    logMariPages(lang, totalRequests, newItems);
    if (data.pagination?.next_page) {
      skip += pageSize;
      console.log(`More pages available, next skip (lang=${lang}): ${skip}`);
    } else {
      console.log(`No more pages - pagination complete (lang=${lang})`);
      more = false;
    }
    if (totalRequests > 50) {
      console.log("Safety limit reached, stopping pagination");
      break;
    }
  }
  console.log(`Total requests made for ${lang}: ${totalRequests}`);
  console.log(`Total items for ${lang}: ${items.length}`);
  return items;
}

async function fetchItemsPage(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Error fetching from API: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  console.log("Pagination info:", data.pagination);
  return data;
}

function logBatchInfo(
  lang: string,
  requestNumber: number,
  newItems: RawKontentItem[],
  totalSoFar: number,
) {
  const languagesInBatch = [
    ...new Set(newItems.map((item) => item.system?.language).filter(Boolean)),
  ];
  console.log(
    `Request ${requestNumber} (lang=${lang}): Found ${newItems.length} page items with slugs, total: ${totalSoFar}`,
  );
  console.log(`Languages in this batch: ${languagesInBatch.join(", ")}`);
}

function logMariPages(lang: string, requestNumber: number, newItems: RawKontentItem[]) {
  const mariPages = newItems.filter((item) => item.system?.codename === "tutorial_mari_page");
  if (mariPages.length > 0) {
    console.log(
      `🔍 Found tutorial_mari_page in batch ${requestNumber} (lang=${lang}):`,
      mariPages
        .map(
          (item) =>
            `${item.system.codename}(${item.system.language}) slug: ${item.elements?.url_slug?.value || item.elements?.slug?.value || "none"}`,
        )
        .join(", "),
    );
  }
}
