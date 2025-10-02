/**
 * Type definitions for the Kontent.ai Duplicate Slugs Finder application
 */

export interface AppConfig {
  projectId: string;
  environmentId: string;
  deliveryApiKey: string;
  managementApiKey: string;
  languages?: string[];
  defaultLanguage?: string;
}

export interface ContentItem {
  name: string;
  codename: string;
  type: string;
  language: string;
  slug: string;
  slugField: "url_slug" | "slug";
}

export interface ApiResult {
  success: boolean;
  items: ContentItem[];
  error?: string;
  method: string;
  field?: string;
  url?: string;
  totalItems?: number;
  totalRequests?: number;
  allSlugsCount?: number;
  similarSlugs?: string[];
  //meliSlugs?: string[];
  exactMatches?: number;
  caseInsensitiveMatches?: number;
  note?: string;
  // For combined results
  deliveryApi?: ApiResult;
  deliveryApiAllItems?: ApiResult;
  managementApi?: ApiResult | null;
}

export interface DuplicateResult {
  duplicates: DuplicateItem[];
  totalItems?: number;
  totalRequests?: number;
  uniqueSlugs?: number;
  error?: string;
}

export interface DuplicateItem {
  slug: string;
  items: DuplicateItemEntry[];
}

export interface DuplicateItemEntry {
  name: string;
  codename: string;
  language: string;
  slugField: "url_slug" | "slug";
}

export interface SearchConfig {
  params: URLSearchParams;
  field: "slug" | "url_slug";
}

export interface PaginationInfo {
  skip: number;
  pageSize: number;
  totalRequests: number;
  more: boolean;
}
