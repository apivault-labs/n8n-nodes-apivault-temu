import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

// Apify actor that does the real work (runs server-side, billed pay-per-event).
const ACTOR_ID = 'apivault_labs~temu-product-scraper';

export class Temu implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Temu Product Scraper',
		name: 'temu',
		icon: 'file:temu.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["exportFormat"]}}',
		description:
			'Scrape Temu products with dropshipping intelligence: USD prices, sold count, demand score, profit margin, hot-product score, variants, Shopify CSV / Google Merchant export.',
		defaults: {
			name: 'Temu Product Scraper',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'apifyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Product URLs or IDs',
				name: 'productUrls',
				type: 'string',
				default: '',
				required: true,
				placeholder:
					'https://www.temu.com/...-g-601099527041816.html, 601099527041816',
				description:
					'One or more Temu product URLs or bare numeric product IDs, separated by commas or new lines.',
			},
			{
				displayName: 'Export Format',
				name: 'exportFormat',
				type: 'options',
				options: [
					{ name: 'Default JSON (all fields)', value: 'default' },
					{ name: 'Shopify Product CSV', value: 'shopify-csv' },
					{ name: 'Google Merchant Feed', value: 'google-merchant' },
				],
				default: 'default',
				description: 'How each product record is shaped',
			},
			{
				displayName: 'Retail Markup Multiplier',
				name: 'retailMarkup',
				type: 'number',
				typeOptions: { minValue: 1, numberPrecision: 1 },
				default: 3.0,
				description:
					'Multiplier applied to Temu cost to estimate retail price (3.0 = 3× markup; lower 1.8-2.2 for eBay/Mercari, higher 4-6 for niche/branded)',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				options: [
					{
						displayName: 'Min Demand Score',
						name: 'minDemandScore',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 100 },
						default: 0,
						description: 'Drop products below this demand score (0-100)',
					},
					{
						displayName: 'Min Hot-Product Score',
						name: 'minHotProductScore',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 100 },
						default: 0,
						description: 'Drop products below this hotProductScore (recommend ≥55 for premium-only)',
					},
					{
						displayName: 'Only Trending',
						name: 'onlyTrending',
						type: 'boolean',
						default: false,
						description: 'Whether to keep only products flagged isTrending (sold ≥ 10K AND rating ≥ 4.4)',
					},
					{
						displayName: 'Only Free Shipping',
						name: 'onlyFreeShipping',
						type: 'boolean',
						default: false,
						description: 'Whether to keep only products with free shipping',
					},
				],
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Write SUMMARY + TOP_PRODUCTS',
						name: 'writeSummary',
						type: 'boolean',
						default: true,
						description: 'Whether to write aggregate KV records (SUMMARY + TOP_PRODUCTS bestseller digest)',
					},
					{
						displayName: 'Extract Variants',
						name: 'extractVariants',
						type: 'boolean',
						default: true,
						description: 'Whether to extract variant options (color, size) — needed for full Shopify migration',
					},
					{
						displayName: 'Extract Image Gallery',
						name: 'extractImages',
						type: 'boolean',
						default: true,
						description: 'Whether to extract all product image URLs (up to 10)',
					},
					{
						displayName: 'Extract Outreach Links',
						name: 'extractOutreachLinks',
						type: 'boolean',
						default: true,
						description: 'Whether to build research links (AliExpress/Amazon/eBay/Google Shopping/TikTok)',
					},
					{
						displayName: 'Max Concurrency',
						name: 'maxConcurrency',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 8 },
						default: 3,
						description: 'Parallel product scrapes (Temu is sensitive — 2-3 recommended)',
					},
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 3 },
						default: 1,
						description: 'Retry count on transient failures',
					},
					{
						displayName: 'Timeout per Product (Seconds)',
						name: 'timeout',
						type: 'number',
						typeOptions: { minValue: 60, maxValue: 300 },
						default: 180,
						description: 'Max wait per Temu product page',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const raw = this.getNodeParameter('productUrls', i) as string;
				const exportFormat = this.getNodeParameter('exportFormat', i) as string;
				const retailMarkup = this.getNodeParameter('retailMarkup', i) as number;
				const filters = this.getNodeParameter('filters', i, {}) as {
					minDemandScore?: number;
					minHotProductScore?: number;
					onlyTrending?: boolean;
					onlyFreeShipping?: boolean;
				};
				const extra = this.getNodeParameter('additionalOptions', i, {}) as {
					writeSummary?: boolean;
					extractVariants?: boolean;
					extractImages?: boolean;
					extractOutreachLinks?: boolean;
					maxConcurrency?: number;
					maxRetries?: number;
					timeout?: number;
				};

				const productUrls = raw
					.split(/[,\n]/)
					.map((u) => u.trim())
					.filter((u) => u.length > 0);

				if (productUrls.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						'No valid product URLs or IDs provided',
						{ itemIndex: i },
					);
				}

				const body: Record<string, unknown> = {
					productUrls,
					exportFormat,
					retailMarkup: String(retailMarkup),
					minDemandScore: filters.minDemandScore ?? 0,
					minHotProductScore: filters.minHotProductScore ?? 0,
					onlyTrending: filters.onlyTrending ?? false,
					onlyFreeShipping: filters.onlyFreeShipping ?? false,
					writeSummary: extra.writeSummary ?? true,
					extractVariants: extra.extractVariants ?? true,
					extractImages: extra.extractImages ?? true,
					extractOutreachLinks: extra.extractOutreachLinks ?? true,
					maxConcurrency: extra.maxConcurrency ?? 3,
					maxRetries: extra.maxRetries ?? 1,
					timeout: extra.timeout ?? 180,
				};

				const options: IRequestOptions = {
					method: 'POST' as IHttpRequestMethods,
					url: `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`,
					body,
					json: true,
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'apifyApi',
					options,
				);

				const results = Array.isArray(response) ? response : [response];
				for (const result of results) {
					returnData.push({ json: result, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
