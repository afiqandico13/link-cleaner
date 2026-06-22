/* Link Cleaner — Tracking Parameter Database
   Comprehensive list of known tracking parameters + prefix patterns.
   Sets window.LinkCleaner with PARAMS (Set), PREFIXES (array), shouldStrip(key).
*/
(function () {
  "use strict";

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

  function shouldStrip(key) {
    if (!key) return false;
    const lower = String(key).toLowerCase();
    if (PARAMS.has(lower)) return true;
    for (const p of PREFIXES) {
      if (lower.startsWith(p)) return true;
    }
    return false;
  }

  window.LinkCleaner = window.LinkCleaner || {};
  window.LinkCleaner.PARAMS = PARAMS;
  window.LinkCleaner.PREFIXES = PREFIXES;
  window.LinkCleaner.shouldStrip = shouldStrip;
  window.LinkCleaner.PARAM_COUNT = PARAMS.size;
})();
