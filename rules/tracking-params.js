/* Link Cleaner — Tracking Parameter Database + Custom Rule Engine
   - 88 built-in tracked params + 4 prefix patterns
   - Per-rule overrides: customStrip (always strip), customKeep (never strip),
     customPrefixes (user-defined prefix patterns)
   - Exports globals on window.LinkCleaner

   shouldStrip(key) precedence (highest → lowest):
     1. customKeep → return false (explicit user override)
     2. built-in prefixes (utm_, fb_, _hs, __hs) → true
     3. customPrefixes → true
     4. customStrip → true
     5. built-in PARAMS → true
     6. otherwise → false
*/
(function () {
  "use strict";

  // ============================================================================
  // BUILT-IN DATABASE — synced with rules/tracking-params.js
  // ============================================================================
  const PARAMS = new Set([
    // Google Analytics / Ads / Tag Manager
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "utm_id", "utm_source_platform", "utm_name", "utm_brand", "utm_social",
    "utm_creative_format", "utm_marketing_tactic",
    "gclid", "gclsrc", "dclid", "gbraid", "wbraid", "yclid",
    "_ga", "_gl",
    // Facebook / Meta
    "fbclid", "fb_action_ids", "fb_action_types", "fb_ref", "fb_source", "fb_locale",
    // Instagram
    "igshid",
    // Twitter / X
    "twclid",
    // TikTok
    "tt_medium", "_ttp",
    // LinkedIn
    "trk", "trkcampaign", "trkcontact", "trkshare", "trksource", "lipi", "lici", "midtoken",
    // Microsoft / Bing Ads
    "msclkid", "mscvid",
    // Mailchimp
    "mc_cid", "mc_eid",
    // HubSpot
    "_hsenc", "_hsmi", "_hsfp", "_hss", "hsctatracking", "__hssc", "__hstc", "__hsfp",
    // Marketo
    "mkt_tok",
    // Pinterest
    "epik",
    // Klaviyo
    "_kx",
    // Matomo
    "mtm_source", "mtm_medium", "mtm_campaign", "mtm_content", "mtm_keyword",
    "mtm_cid", "mtm_group", "mtm_placement", "mtm_term",
    // Outbrain / Taboola
    "obclid", "obOrigUrl", "obutm_source",
    // Yandex
    "_openstat",
    // Quora
    "qclid",
    // Reddit
    "ref_source", "ref_campaign",
    // Snap
    "scid",
    // Generic / CMS / misc
    "ref", "ref_src", "ref_url",
    "source", "src", "source_id",
    "campaign_id", "ad_id", "ad_group_id", "creative_id", "placement_id",
    "spm", "scm",
    "vero_id", "vero_conv",
    "_branch_match_id",
    "ncid", "nr_email_referer",
  ]);

  const PREFIXES = [
    "utm_",
    "fb_",
    "_hs",
    "__hs",
  ];

  // ============================================================================
  // CUSTOM RULE STATE — mutable, set via setCustomRules() from popup/options
  // ============================================================================
  const customStrip = new Set();
  const customKeep = new Set();
  const customPrefixes = new Set();

  /**
   * Update the per-rule overrides. Pass arrays of strings (case-insensitive).
   * @param {{strip?: string[], keep?: string[], prefixes?: string[]}} rules
   */
  function setCustomRules(rules) {
    if (rules && Array.isArray(rules.strip)) {
      customStrip.clear();
      rules.strip.forEach((k) => customStrip.add(String(k).toLowerCase()));
    }
    if (rules && Array.isArray(rules.keep)) {
      customKeep.clear();
      rules.keep.forEach((k) => customKeep.add(String(k).toLowerCase()));
    }
    if (rules && Array.isArray(rules.prefixes)) {
      customPrefixes.clear();
      rules.prefixes.forEach((p) => customPrefixes.add(String(p).toLowerCase()));
    }
  }

  function shouldStrip(key) {
    if (!key) return false;
    const lower = String(key).toLowerCase();
    if (customKeep.has(lower)) return false;
    for (const p of PREFIXES) {
      if (lower.startsWith(p)) return true;
    }
    for (const p of customPrefixes) {
      if (lower.startsWith(p)) return true;
    }
    if (customStrip.has(lower)) return true;
    if (PARAMS.has(lower)) return true;
    return false;
  }

  window.LinkCleaner = window.LinkCleaner || {};
  window.LinkCleaner.PARAMS = PARAMS;
  window.LinkCleaner.PREFIXES = PREFIXES;
  window.LinkCleaner.customStrip = customStrip;
  window.LinkCleaner.customKeep = customKeep;
  window.LinkCleaner.customPrefixes = customPrefixes;
  window.LinkCleaner.shouldStrip = shouldStrip;
  window.LinkCleaner.setCustomRules = setCustomRules;
  window.LinkCleaner.PARAM_COUNT = PARAMS.size;
})();
