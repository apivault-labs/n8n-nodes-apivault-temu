# n8n-nodes-apivault-temu

An [n8n](https://n8n.io) community node for the **Temu Product Scraper** — scrape Temu products and get 14 layers of dropshipping intelligence in one step.

No login. Pay-as-you-go, no monthly subscription. The scraping and enrichment run server-side on [Apify](https://apify.com); this node is a thin connector you drive with your own Apify API token.

Built by **[apivault_labs](https://apify.com/apivault_labs)** — see [all our actors](https://apify.com/apivault_labs).

## What you get per product

- **Pricing**: USD-normalized price (10 currencies + FX), original price, discount %
- **Demand**: parsed sold count (10K+ → 10000) with tier, demand score 0-100, reviews, rating
- **Profit**: margin estimator with arbitrage tier (low/medium/high/unicorn) from your retail markup
- **Catalog**: auto-category, image gallery, variants (color/size), shipping parser (free-shipping flag)
- **Signals**: hot-product score 0-100, trend detection, risk flags
- **Research**: one-click outreach links (AliExpress / Amazon / eBay / Google Shopping / TikTok)
- **Export**: default JSON, **Shopify Product CSV**, or **Google Merchant feed**

## Installation

In your n8n instance:

1. Go to **Settings → Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-apivault-temu`
4. Confirm and install

## Credentials

This node uses an **Apify API token**:

1. Create a free account at [apify.com](https://apify.com)
2. Go to **Apify Console → Settings → Integrations** and copy your **API token**
3. In n8n, create new **Apify API** credentials and paste the token

A free Apify account includes monthly usage credits.

## Usage

- **Product URLs or IDs** — Temu product URLs (`https://www.temu.com/...-g-<id>.html`) or bare numeric IDs, separated by commas or new lines
- **Export Format** — default JSON / Shopify CSV / Google Merchant
- **Retail Markup Multiplier** — drives the profit-margin estimate (3.0 = 3× markup)
- **Filters** — min demand score, min hot-product score, only trending, only free shipping
- **Additional Options** — variants, image gallery, outreach links, concurrency, retries, timeout

Each product produces one output item.

## Pricing

Billed per product through Apify (pay-per-event): **$3 / 1,000 products** ($0.003 each). Enrichment layers are free.

## Use cases

- **Winning-product research** — filter by hot-product score and demand
- **Shopify migration** — export ready-to-import Product CSV with variants and images
- **Amazon/eBay arbitrage** — profit-margin estimate with arbitrage tier
- **Price & trend monitoring** — track sold count and price over time

## Resources

- [Temu Product Scraper actor on Apify](https://apify.com/apivault_labs/temu-product-scraper)
- [All actors by apivault_labs](https://apify.com/apivault_labs)
- Prefer Python? Use the [Python SDK](https://github.com/apivault-labs/temu-product-scraper-python)
- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)

## Keywords

`temu` `temu-scraper` `temu-product-scraper` `dropshipping` `winning-products` `profit-margin` `shopify-csv` `google-merchant-feed` `product-research` `ecommerce-scraper` `n8n` `apify`
