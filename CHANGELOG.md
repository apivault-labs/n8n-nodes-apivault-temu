# Changelog

## 0.1.0

- Initial release.
- `Temu Product Scraper` node: scrape one or more Temu products by URL or ID.
- Returns 14 dropshipping-intelligence layers (USD prices, sold count,
  demand score, profit margin, hot-product score, variants, risk flags).
- Export formats: default JSON / Shopify CSV / Google Merchant feed.
- Server-side filters (demand/hot score, trending, free shipping) and
  retail-markup estimator.
- `Apify API` credentials with token test against `/users/me`.
- Calls the `apivault_labs/temu-product-scraper` actor via
  `run-sync-get-dataset-items`.
