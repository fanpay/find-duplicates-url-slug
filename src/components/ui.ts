/**
 * UI components and rendering functions
 */

import { getConfigStatus, getConfiguredLanguages, appConfig, hasUserConfiguredLanguages } from "../config";
import type { ApiResult, ContentItem, DuplicateResult } from "../types";
import type { DuplicateGroup, DuplicateSummaryItem } from "../utils";

/**
 * Create the main UI structure
 */
export function createMainUI(): string {
  return `
    <div class="container">
      <h1 class="title">Find Duplicate Slugs - Kontent.ai</h1>
      
      <div class="button-group">
        <button id="config-btn" class="button button-primary">Show Config</button>
        <button id="search-btn" class="button button-warning">Search Slug</button>
        <button id="find-btn" class="button button-success">Find All Duplicates</button>
      </div>
      
      <div id="search-section" class="search-section" style="display: none;">
        <div class="search-input-group">
          <input id="slug-input" type="text" placeholder="Enter slug to search..." class="slug-input" />
          <button id="execute-search-btn" class="button button-search">🔍 Execute Search</button>
        </div>
      </div>
      
      <div id="result" class="result-container">
        Click "Show Config" to verify settings, "Search Slug" to find specific slugs, or "Find All Duplicates" to scan the entire project for duplicate slugs.
      </div>
    </div>
  `;
}

/**
 * Render language configuration interface
 */
export function renderLanguageConfiguration(): string {
  const currentLanguages = getConfiguredLanguages();
  const defaultLang = appConfig.defaultLanguage || 'en';
  
  return `
    <div class="config-section">
      <h2 style="color: #495057; margin-top: 0;">Language Configuration</h2>
      
      <div style="margin-bottom: 20px;">
        <strong>Current Languages:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${currentLanguages.join(', ')}
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          ${appConfig.languages?.length ? 
            'Configured via VITE_KONTENT_LANGUAGES' : 
            `Using default language: ${defaultLang}`}
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <label for="languages-input" style="display: block; margin-bottom: 5px; font-weight: bold;">
          Languages (comma-separated):
        </label>
        <input 
          id="languages-input" 
          type="text" 
          placeholder="de,en,zh" 
          value="${appConfig.languages?.join(',') || ''}"
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
        />
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          Enter language codes separated by commas (e.g., "de,en,zh")
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label for="default-lang-input" style="display: block; margin-bottom: 5px; font-weight: bold;">
          Default Language:
        </label>
        <input 
          id="default-lang-input" 
          type="text" 
          placeholder="en" 
          value="${defaultLang}"
          style="width: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
        />
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          Used when no specific languages are configured
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <button id="apply-languages-btn" class="button button-success" style="margin-right: 10px;">
          Apply Languages
        </button>
        <button id="reset-languages-btn" class="button button-secondary">
          Reset to Default
        </button>
      </div>
      
      <div style="margin-top: 20px; padding: 10px; background: #d1ecf1; border-radius: 4px; font-size: 14px;">
        <strong>💡 Session Configuration:</strong><br>
        • Changes apply immediately and persist during this session<br>
        • Will be used for all searches until page reload<br>
        • For permanent config, set VITE_KONTENT_LANGUAGES in .env file<br>
        • ${hasUserConfiguredLanguages() ? '✅ Currently using your custom settings' : '📋 Currently using environment/default settings'}
      </div>
    </div>
  `;
}

/**
 * Render configuration display
 */
export function renderConfiguration(): string {
  const config = getConfigStatus();

  return `
    <div class="config-section">
      <h2 style="color: #495057; margin-top: 0;">Current Configuration</h2>
      
      <div style="margin-bottom: 15px;">
        <strong>Environment ID:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${config.environmentId || '<span style="color: red;">✗ NOT SET</span>'}
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          ${config.environmentId ? 'Automatically detected from Kontent.ai context or .env file' : 'Configure VITE_KONTENT_ENVIRONMENT_ID in .env file or embed as Custom App'}
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <strong>Languages to Search:</strong>
          <button id="configure-languages-btn" class="button button-info small">
            ⚙️ Configure
          </button>
        </div>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${getConfiguredLanguages().join(', ') || '<span style="color: orange;">Using default language</span>'}
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          ${appConfig.languages?.length ? 
            `Configured via VITE_KONTENT_LANGUAGES` : 
            `Using default language: ${appConfig.defaultLanguage}`}
        </div>
      </div>
      
      <!-- <div style="margin-bottom: 15px;">
        <strong>Delivery API Key:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${config.environmentId ? '<span style="color: green;">✓ Present</span>' : '<span style="color: red;">✗ Not Set</span>'}
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Management API Key:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${config.environmentId ? '<span style="color: green;">✓ Present</span>' : '<span style="color: red;">✗ Not Set</span>'}
        </div>
      </div> -->
      
      <div style="margin-top: 20px; padding: 10px; background: #d1ecf1; border-radius: 4px; font-size: 14px;">
        <strong>Note:</strong> Check the browser console for detailed configuration logs.
      </div>
    </div>
  `;
}

/**
 * Render search results
 */
export function renderSearchResults(result: ApiResult, targetSlug: string): string {
  if ("error" in result && result.error) {
    return `<p style="color:red; background:#ffe6e6; padding:10px; border-radius:4px;"><strong>Error:</strong> ${result.error}</p>`;
  }

  const items = result.items || [];
  const debugInfo = renderDebugInfo(result);

  if (items.length === 0) {
    return `
      <div class="status-warning">
        <h3 style="margin-top:0;">No Results Found</h3>
        <p>No pages found with slug "<strong>${targetSlug}</strong>" in any language.</p>
        <p style="color:#666; font-style:italic; margin-top:12px;">The search looks for exact matches across all available languages in your Kontent.ai project.</p>
      </div>
      ${debugInfo}
    `;
  }

  // Calculate language statistics
  const languageCount = new Set(items.map((item) => item.language)).size;
  const languageList = [...new Set(items.map((item) => item.language))].sort((a, b) =>
    a.localeCompare(b),
  );

  return `
    <div class="status-success">
      <h2 style="margin-top:0;">✅ Found ${items.length} page(s) with slug "${targetSlug}"</h2>
      <div class="search-stats">
        <div class="stat-item">
          <span class="stat-number">${items.length}</span>
          <span class="stat-label">Total Items</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${languageCount}</span>
          <span class="stat-label">Language${languageCount > 1 ? "s" : ""}</span>
        </div>
      </div>
      <div class="languages-found">
        <strong>Languages found:</strong> ${languageList.map((lang) => `<span class="lang-pill">${lang}</span>`).join(" ")}
      </div>
      ${renderItemCards(items)}
    </div>
    ${debugInfo}
  `;
}

/**
 * Render duplicate results
 */
export function renderDuplicateResults(result: DuplicateResult): string {
  if ("error" in result && result.error) {
    return `<p style="color:red; background:#ffe6e6; padding:10px; border-radius:4px;"><strong>Error:</strong> ${result.error}</p>`;
  }

  const duplicates = result.duplicates || [];
  const statsHtml = renderStatsBox(result);

  if (duplicates.length === 0) {
    return `${statsHtml}
      <div class="status-warning">
        <h3 style="margin-top:0;">✅ No Duplicate Slugs Found</h3>
        <p>All page slugs in your environment are unique!</p>
      </div>`;
  }
  // Adapt DuplicateItem[] shape to DuplicateGroup[] expected by renderDuplicateCards
  const adaptedDuplicates: DuplicateGroup[] = duplicates.map((d) => ({
    slug: d.slug,
    items: d.items.map((i) => ({
      name: i.name,
      codename: i.codename,
      languages: [i.language],
      language: i.language,
      slugField: i.slugField,
      languageCount: 1,
    })),
  }));

  return `${statsHtml}
    <div class="status-error">
      <h2 style="margin-top:0;">⚠️ Found ${duplicates.length} Duplicate Slug${duplicates.length > 1 ? "s" : ""}</h2>
      ${renderDuplicateCards(adaptedDuplicates)}
    </div>`;
}

/**
 * Render debug information section
 */
function renderDebugInfo(result: ApiResult): string {
  const debug = result; // already typed

  if (!debug) return "";

  return `
    <div class="debug-section">
      <h3 style="margin-top:0; color:#495057;">Debug Information</h3>
      
      <h4>Delivery API Direct Search:</h4>
      <div style="font-size:12px; margin-bottom:10px;">
        Success: ${debug.deliveryApi?.success ? "✅" : "❌"}<br>
        Items found: ${debug.deliveryApi?.items?.length || 0}<br>
        Method: ${debug.deliveryApi?.method}<br>
        Field used: ${debug.deliveryApi?.field || "None"}<br>
        ${debug.deliveryApi?.url ? `URL: ${debug.deliveryApi.url}` : ""}
      </div>
      
      <h4>Delivery API All Items Search:</h4>
      <div style="font-size:12px; margin-bottom:10px;">
        Success: ${debug.deliveryApiAllItems?.success ? "✅" : "❌"}<br>
        Items found: ${debug.deliveryApiAllItems?.items?.length || 0}<br>
        Total API requests: ${debug.deliveryApiAllItems?.totalRequests || 0}<br>
        Total items fetched: ${debug.deliveryApiAllItems?.totalItems || 0}<br>
        Total unique slugs: ${debug.deliveryApiAllItems?.allSlugsCount || 0}<br>
        Exact slug matches: ${debug.deliveryApiAllItems?.exactMatches || 0}<br>
        Case-insensitive matches: ${debug.deliveryApiAllItems?.caseInsensitiveMatches || 0}<br>
        Similar slugs: ${debug.deliveryApiAllItems?.similarSlugs?.join(", ") || "None"}<br>
      </div>
      
      ${
        debug.managementApi
          ? `
        <h4>Management API Search:</h4>
        <div style="font-size:12px;">
          ${(() => {
            const ok = debug.managementApi.success;
            return `Success: ${ok ? "✅" : "❌"}`;
          })()}<br>
          Note: ${debug.managementApi.note || "No additional info"}
        </div>
      `
          : ""
      }
      
      <div style="margin-top:10px; font-size:11px; color:#6c757d;">
        Check browser console for detailed logs
      </div>
    </div>
  `;
}

/**
 * Render item cards
 */
function renderItemCards(items: ContentItem[]): string {
  // Group items by language for better organization
  const itemsByLanguage = items.reduce(
    (acc, item) => {
      const lang = item.language || "Unknown";
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(item);
      return acc;
    },
    {} as Record<string, ContentItem[]>,
  );

  // Generate HTML for each language group
  const languageGroups = Object.entries(itemsByLanguage)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([language, langItems]) => `
      <div class="language-group">
        <h4 class="language-header">🌐 Language: ${language} (${langItems.length} item${langItems.length > 1 ? "s" : ""})</h4>
        ${langItems
          .map(
            (item: ContentItem) => `
          <div class="item-card">
            <div class="item-header">
              <strong>${item.name}</strong>
              <span class="language-badge">${item.language}</span>
            </div>
            <div class="item-details">
              <div><strong>Codename:</strong> <code>${item.codename}</code></div>
              <div><strong>Type:</strong> ${item.type}</div>
              <div><strong>Slug:</strong> <span class="slug-value">${item.slug}</span></div>
              <div><strong>Field type:</strong> <span style="font-family:monospace; color:#666;">${item.slugField}</span></div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `,
    );

  return languageGroups.join("");
}

/**
 * Render duplicate cards
 */
function renderDuplicateCards(duplicates: DuplicateGroup[]): string {
  return duplicates
    .map((d: DuplicateGroup) => {
      const contentItemsCount = d.items.length;
      const totalLanguageVariants = d.items.reduce(
        (sum: number, item: DuplicateSummaryItem) => sum + (item.languageCount || 1),
        0,
      );

      return `
      <div class="duplicate-card">
        <div class="duplicate-header">
          <h4><span class="slug-value">${d.slug}</span></h4>
          <div class="duplicate-stats">
            <span class="stat-badge stat-danger">${contentItemsCount} different content items</span>
            <span class="stat-badge stat-info">${totalLanguageVariants} total variants</span>
          </div>
        </div>
        
        <div class="duplicate-content">
          <div class="duplicate-explanation">
            <strong>⚠️ Duplicate Issue:</strong> ${contentItemsCount} different content items are using the same slug "${d.slug}"
          </div>
          
          <div class="content-items">
            ${d.items
              .map(
                (item: DuplicateSummaryItem) => `
              <div class="content-item-card">
                <div class="content-header">
                  <h5>${item.name}</h5>
                  <span class="codename-badge">Codename: ${item.codename}</span>
                </div>
                <div class="content-details">
                  <div class="item-meta">
                    <strong>Languages:</strong> ${item.languages ? item.languages.map((lang: string) => `<span class="lang-pill">${lang}</span>`).join(" ") : item.language}
                  </div>
                  <div class="item-meta">
                    <strong>Field type:</strong> <span class="field-type">${item.slugField}</span>
                  </div>
                  ${item.languageCount > 1 ? `<div class="item-meta"><strong>Total language variants:</strong> ${item.languageCount}</div>` : ""}
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

/**
 * Render statistics box
 */
function renderStatsBox(result: DuplicateResult): string {
  const duplicates = result.duplicates || [];

  return `
    <div class="stats-box">
      <h3 style="margin-top:0; color:#0066cc;">Search Statistics</h3>
      <div style="font-size:14px;">
        <strong>Total API requests:</strong> ${result.totalRequests || "N/A"}<br>
        <strong>Total page items processed:</strong> ${result.totalItems || "N/A"}<br>
        <strong>Unique slugs found:</strong> ${result.uniqueSlugs || "N/A"}<br>
        <strong>Duplicate slugs found:</strong> ${duplicates.length}<br>
      </div>
      <div style="margin-top:10px; font-size:12px; color:#666;">
        Check browser console for detailed pagination logs
      </div>
    </div>
  `;
}
