/**
 * Utility functions for data manipulation and formatting
 */

import type { ContentItem, SearchConfig } from "../types";

// Raw Kontent Delivery item shape (partial)
interface RawSystem {
  name?: string;
  codename?: string;
  type?: string;
  language?: string;
}

interface RawElementsSlugField {
  value?: string;
}

interface RawElements {
  url_slug?: RawElementsSlugField;
  slug?: RawElementsSlugField;
  [key: string]: unknown;
}

export interface RawKontentItem {
  system: RawSystem;
  elements?: RawElements;
  [key: string]: unknown;
}

/**
 * Format API item to standardized ContentItem interface
 */
export function formatItem(item: RawKontentItem): ContentItem {
  const slugValue = item.elements?.url_slug?.value || item.elements?.slug?.value || "No slug";

  return {
    name: item.system?.name || "Unknown",
    codename: item.system?.codename || "Unknown",
    type: item.system?.type || "Unknown",
    language: item.system?.language || "Unknown",
    slug: slugValue,
    slugField: item.elements?.url_slug?.value ? "url_slug" : "slug",
  };
}

/**
 * Remove duplicate items based on codename+language combination to preserve multilingual variants
 */
export function removeDuplicateItems(items: ContentItem[]): ContentItem[] {
  return items.filter(
    (item, index, self) =>
      index === self.findIndex((i) => i.codename === item.codename && i.language === item.language),
  );
}

/**
 * Get unique slugs from items array
 */
export function getUniqueSlugValues(items: RawKontentItem[]): string[] {
  const values = items
    .map((item) => item.elements?.url_slug?.value || item.elements?.slug?.value)
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  return [...new Set(values)];
}

/**
 * Create search configurations for different field types
 */
export function createSearchConfigs(targetSlug: string): SearchConfig[] {
  return [
    // Try 'slug' field with type filter
    {
      params: new URLSearchParams({
        "system.type": "page",
        "elements.slug": targetSlug,
        depth: "0",
        limit: "100",
      }),
      field: "slug",
    },
    // Try 'url_slug' field with type filter
    {
      params: new URLSearchParams({
        "system.type": "page",
        "elements.url_slug": targetSlug,
        depth: "0",
        limit: "100",
      }),
      field: "url_slug",
    },
    // Try 'slug' field without type filter
    {
      params: new URLSearchParams({
        "elements.slug": targetSlug,
        depth: "0",
        limit: "100",
      }),
      field: "slug",
    },
    // Try 'url_slug' field without type filter
    {
      params: new URLSearchParams({
        "elements.url_slug": targetSlug,
        depth: "0",
        limit: "100",
      }),
      field: "url_slug",
    },
  ];
}

/**
 * Create HTTP headers for Kontent.ai API requests
 */
export function createApiHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

/**
 * Filter items by matching slug value
 */
export function filterItemsBySlug(items: RawKontentItem[], targetSlug: string): RawKontentItem[] {
  return items.filter((item) => {
    const hasMatchingSlug =
      item.elements?.slug?.value === targetSlug || item.elements?.url_slug?.value === targetSlug;
    const isPageType = item.system?.type === "page";

    return hasMatchingSlug && isPageType;
  });
}

/**
 * Filter items by page type and presence of slug
 */
export function filterPageItemsWithSlugs(items: RawKontentItem[]): RawKontentItem[] {
  return items.filter(
    (item) =>
      item.system?.type === "page" &&
      (item.elements?.url_slug?.value || item.elements?.slug?.value),
  );
}

/**
 * Find slugs that contain a specific substring (case-insensitive)
 */
export function findSimilarSlugs(allSlugs: string[], searchTerm: string): string[] {
  return allSlugs.filter((slug) => slug?.toLowerCase().includes(searchTerm.toLowerCase()));
}

/**
 * Count items by field type
 */
export function countItemsByFieldType(items: RawKontentItem[]): {
  urlSlugCount: number;
  slugCount: number;
} {
  return {
    urlSlugCount: items.filter((item) => item.elements?.url_slug?.value).length,
    slugCount: items.filter((item) => item.elements?.slug?.value).length,
  };
}

/**
 * Group items by slug value and identify true duplicates (different content items with same slug)
 */
type SlimItem = {
  name: string;
  codename: string;
  language: string;
  slugField: "url_slug" | "slug";
};
export function groupItemsBySlug(items: RawKontentItem[]): Map<string, SlimItem[]> {
  const slugMap = new Map<string, SlimItem[]>();

  for (const item of items) {
    const slug = item.elements?.url_slug?.value || item.elements?.slug?.value;

    if (slug) {
      if (!slugMap.has(slug)) {
        slugMap.set(slug, []);
      }

      slugMap.get(slug)?.push({
        name: item.system.name || "Unknown",
        codename: item.system.codename || "unknown_codename",
        language: item.system.language || "unknown_language",
        slugField: item.elements?.url_slug?.value ? "url_slug" : "slug",
      });
    }
  }

  return slugMap;
}

/**
 * Filter duplicate entries from slug map - only return true duplicates (different codenames with same slug)
 */
export interface DuplicateSummaryItem {
  name: string;
  codename: string;
  languages: string[];
  language: string; // backward compatible aggregated language string
  slugField: "url_slug" | "slug";
  languageCount: number;
}

export interface DuplicateGroup {
  slug: string;
  items: DuplicateSummaryItem[];
}

export function filterDuplicates(slugMap: Map<string, SlimItem[]>): DuplicateGroup[] {
  return Array.from(slugMap.entries())
    .filter(([, arr]) => {
      // Group by codename to identify unique content items
      const uniqueCodenames = new Set(arr.map((item) => item.codename));
      // Only consider it a duplicate if there are multiple different content items (codenames)
      return uniqueCodenames.size > 1;
    })
    .map(([slug, arr]) => {
      // Group items by codename for better display
      const groupedByCodename = arr.reduce(
        (
          acc: Record<
            string,
            {
              name: string;
              codename: string;
              language: string;
              slugField: string;
            }[]
          >,
          item,
        ) => {
          if (!acc[item.codename]) {
            acc[item.codename] = [];
          }
          acc[item.codename].push(item);
          return acc;
        },
        {} as Record<
          string,
          {
            name: string;
            codename: string;
            language: string;
            slugField: string;
          }[]
        >,
      );

      // Create summary items showing each content item and its languages
      const summaryItems: DuplicateSummaryItem[] = Object.entries(groupedByCodename).map(
        ([codename, languageItems]) => ({
          name: languageItems[0].name,
          codename,
          languages: languageItems.map((item) => item.language).sort((a, b) => a.localeCompare(b)),
          language: languageItems.map((item) => item.language).join(", "), // For backward compatibility
          slugField: languageItems[0].slugField as "url_slug" | "slug",
          languageCount: languageItems.length,
        }),
      );

      return { slug, items: summaryItems };
    });
}

/**
 * Log item details for debugging
 */
export function logItemDetails(item: RawKontentItem, targetSlug: string): void {
  const hasMatchingSlug =
    item.elements?.slug?.value === targetSlug || item.elements?.url_slug?.value === targetSlug;
  const isPageType = item.system?.type === "page";

  console.log(`Item ${item.system?.codename}:`, {
    type: item.system?.type,
    slug: item.elements?.slug?.value,
    url_slug: item.elements?.url_slug?.value,
    matchesSlug: hasMatchingSlug,
    isPage: isPageType,
  });
}
