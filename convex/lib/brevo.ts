/**
 * Brevo Email Marketing API Client Library
 *
 * Type-safe client for Brevo (formerly Sendinblue) API integration.
 * Provides typed wrappers for contacts, lists, campaigns, and templates.
 *
 * @see https://developers.brevo.com/reference
 */

// ═══════════════════════════════════════════════════════
// TYPES - Brevo API Request/Response Payloads
// ═══════════════════════════════════════════════════════

/**
 * Contact attributes in Brevo
 */
export interface BrevoContactAttributes {
	FIRSTNAME?: string;
	LASTNAME?: string;
	SMS?: string;
	[key: string]: string | number | boolean | undefined;
}

/**
 * Contact creation/update payload
 */
export interface BrevoContactPayload {
	email: string;
	attributes?: BrevoContactAttributes;
	listIds?: number[];
	updateEnabled?: boolean;
	emailBlacklisted?: boolean;
	smsBlacklisted?: boolean;
}

/**
 * Contact response from Brevo API
 */
export interface BrevoContactResponse {
	id: number;
	email: string;
	emailBlacklisted: boolean;
	smsBlacklisted: boolean;
	createdAt: string;
	modifiedAt: string;
	attributes: BrevoContactAttributes;
	listIds: number[];
	listUnsubscribed: number[];
}

/**
 * Contact list creation payload
 */
export interface BrevoListPayload {
	name: string;
	folderId: number;
}

/**
 * Contact list response
 */
export interface BrevoListResponse {
	id: number;
	name: string;
	totalBlacklisted: number;
	totalSubscribers: number;
	folderId: number;
	createdAt: string;
	campaignStats: Array<{
		campaignId: number;
		stats: Record<string, number>;
	}>;
	dynamicList: boolean;
}

/**
 * Email campaign creation payload
 */
export interface BrevoCampaignPayload {
	name: string;
	subject: string;
	sender: {
		name: string;
		email: string;
	};
	htmlContent?: string;
	templateId?: number;
	recipients: {
		listIds: number[];
		exclusionListIds?: number[];
	};
	scheduledAt?: string; // ISO 8601 format
	replyTo?: string;
	tag?: string;
}

/**
 * Email campaign response
 */
export interface BrevoCampaignResponse {
	id: number;
	name: string;
	subject: string;
	type: string;
	status: string;
	scheduledAt?: string;
	testSent: boolean;
	header: string;
	footer: string;
	sender: {
		name: string;
		email: string;
	};
	replyTo: string;
	toField: string;
	htmlContent: string;
	tag: string;
	createdAt: string;
	modifiedAt: string;
	recipients: {
		lists: number[];
		exclusionLists: number[];
	};
	statistics: BrevoCampaignStats;
}

/**
 * Campaign statistics
 */
export interface BrevoCampaignStats {
	globalStats?: {
		uniqueClicks: number;
		clickers: number;
		complaints: number;
		delivered: number;
		sent: number;
		softBounces: number;
		hardBounces: number;
		uniqueViews: number;
		unsubscriptions: number;
		viewed: number;
		deferred?: number;
	};
	campaignStats?: Array<{
		listId: number;
		uniqueClicks: number;
		clickers: number;
		complaints: number;
		delivered: number;
		sent: number;
		softBounces: number;
		hardBounces: number;
		uniqueViews: number;
		unsubscriptions: number;
		viewed: number;
	}>;
	mirrorClick?: number;
	remaining?: number;
	linksStats?: Record<string, { uniqueClicks: number; clickers: number }>;
	statsByDomain?: Record<
		string,
		{
			sent: number;
			delivered: number;
			hardBounces: number;
			softBounces: number;
			deferred?: number;
		}
	>;
}

/**
 * Email template creation payload
 */
export interface BrevoTemplatePayload {
	name: string;
	subject: string;
	htmlContent: string;
	sender: {
		name: string;
		email: string;
	};
	replyTo?: string;
	isActive?: boolean;
}

/**
 * Email template response
 */
export interface BrevoTemplateResponse {
	id: number;
	name: string;
	subject: string;
	isActive: boolean;
	testSent: boolean;
	sender: {
		name: string;
		email: string;
	};
	replyTo: string;
	toField: string;
	tag: string;
	htmlContent: string;
	createdAt: string;
	modifiedAt: string;
}

/**
 * Webhook event types from Brevo
 */
export type BrevoWebhookEventType =
	| 'delivered'
	| 'soft_bounce'
	| 'hard_bounce'
	| 'complaint'
	| 'unsubscribed'
	| 'opened'
	| 'click'
	| 'invalid_email'
	| 'deferred'
	| 'blocked'
	| 'error';

/**
 * Webhook payload from Brevo
 */
export interface BrevoWebhookPayload {
	event: BrevoWebhookEventType;
	email: string;
	id: number;
	date: string;
	ts: number;
	'message-id'?: string;
	ts_event?: number;
	subject?: string;
	tag?: string;
	sending_ip?: string;
	ts_epoch?: number;
	template_id?: number;
	// Click-specific
	link?: string;
	// Bounce-specific
	reason?: string;
}

/**
 * API error response
 */
export interface BrevoApiError {
	code: string;
	message: string;
}

// ═══════════════════════════════════════════════════════
// TRANSACTIONAL EMAIL TYPES
// ═══════════════════════════════════════════════════════

/**
 * Transactional email recipient
 */
export interface BrevoEmailRecipient {
	email: string;
	name?: string;
}

/**
 * Transactional email payload for /smtp/email endpoint
 */
export interface BrevoTransactionalEmailPayload {
	sender: { name: string; email: string };
	to: BrevoEmailRecipient[];
	cc?: BrevoEmailRecipient[];
	bcc?: BrevoEmailRecipient[];
	replyTo?: { email: string; name?: string };
	subject?: string; // Required if no templateId
	htmlContent?: string; // Required if no templateId
	textContent?: string;
	templateId?: number; // Use Brevo template instead of inline content
	params?: Record<string, unknown>; // Variables for template (e.g., {{params.firstName}})
	tags?: string[];
	headers?: Record<string, string>;
	attachment?: Array<{
		name: string;
		content: string; // base64 encoded
		url?: string;
	}>;
}

/**
 * Transactional email response from Brevo
 */
export interface BrevoTransactionalEmailResponse {
	messageId: string;
}

// ═══════════════════════════════════════════════════════
// BREVO API CLIENT
// ═══════════════════════════════════════════════════════

const BREVO_API_BASE = 'https://api.brevo.com/v3';

/**
 * Generic fetch wrapper for Brevo API
 * Handles authentication, error handling, and response parsing
 */
export async function brevoFetch<T>(
	endpoint: string,
	options: {
		method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
		body?: unknown;
		apiKey?: string;
		retries?: number;
	} = {},
): Promise<T> {
	const apiKey = options.apiKey || process.env.BREVO_API_KEY;
	const retries = options.retries ?? 3;

	if (!apiKey) {
		throw new Error('BREVO_API_KEY environment variable is not set');
	}

	const url = `${BREVO_API_BASE}${endpoint}`;

	let lastError: unknown;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const response = await fetch(url, {
				method: options.method || 'GET',
				headers: {
					'api-key': apiKey,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: options.body ? JSON.stringify(options.body) : undefined,
			});

			// Handle no content responses
			if (response.status === 204) {
				return undefined as T;
			}

			// If rate limited or server error, throw to trigger retry
			if (response.status === 429 || response.status >= 500) {
				const text = await response.text();
				throw new Error(`Brevo API Error ${response.status}: ${text}`);
			}

			const data = await response.json();

			if (!response.ok) {
				const error = data as BrevoApiError;
				throw new Error(`Brevo API Error: ${error.code} - ${error.message}`);
			}

			return data as T;
		} catch (error) {
			lastError = error;
			const isRetryable =
				error instanceof Error &&
				(error.message.includes('429') ||
					error.message.includes('500') ||
					error.message.includes('502') ||
					error.message.includes('503') ||
					error.message.includes('504') ||
					error.message.includes('fetch failed'));

			if (attempt < retries && isRetryable) {
				const delay = 2 ** attempt * 1000; // 1s, 2s, 4s
				await new Promise((resolve) => setTimeout(resolve, delay));
				continue;
			}
			throw error;
		}
	}

	throw lastError;
}

// ═══════════════════════════════════════════════════════
// CONTACTS API
// ═══════════════════════════════════════════════════════

export const brevoContacts = {
	/**
	 * Create a new contact
	 */
	async create(payload: BrevoContactPayload): Promise<{ id: number }> {
		return brevoFetch<{ id: number }>('/contacts', {
			method: 'POST',
			body: payload,
		});
	},

	/**
	 * Update an existing contact by email
	 */
	async update(email: string, payload: Omit<BrevoContactPayload, 'email'>): Promise<void> {
		return brevoFetch<void>(`/contacts/${encodeURIComponent(email)}`, {
			method: 'PUT',
			body: payload,
		});
	},

	/**
	 * Get contact by email or ID
	 */
	async get(identifier: string | number): Promise<BrevoContactResponse> {
		const id = typeof identifier === 'number' ? identifier : encodeURIComponent(identifier);
		return brevoFetch<BrevoContactResponse>(`/contacts/${id}`);
	},

	/**
	 * Delete a contact by email or ID
	 */
	async delete(identifier: string | number): Promise<void> {
		const id = typeof identifier === 'number' ? identifier : encodeURIComponent(identifier);
		return brevoFetch<void>(`/contacts/${id}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Create or update contact (upsert)
	 */
	async upsert(payload: BrevoContactPayload): Promise<{ id: number }> {
		return brevoFetch<{ id: number }>('/contacts', {
			method: 'POST',
			body: { ...payload, updateEnabled: true },
		});
	},

	/**
	 * Add contacts to a list
	 */
	async addToList(
		listId: number,
		emails: string[],
	): Promise<{ contacts: { success: string[]; failure: string[] } }> {
		return brevoFetch(`/contacts/lists/${listId}/contacts/add`, {
			method: 'POST',
			body: { emails },
		});
	},

	/**
	 * Remove contacts from a list
	 */
	async removeFromList(
		listId: number,
		emails: string[],
	): Promise<{ contacts: { success: string[]; failure: string[] } }> {
		return brevoFetch(`/contacts/lists/${listId}/contacts/remove`, {
			method: 'POST',
			body: { emails },
		});
	},

	/**
	 * Import contacts in bulk
	 */
	async import(payload: {
		fileBody?: string;
		jsonBody?: Array<{
			email: string;
			attributes?: Record<string, any>;
			sms?: string;
		}>;
		listIds?: number[];
		emailBlacklist?: boolean;
		smsBlacklist?: boolean;
		updateExistingContacts?: boolean;
		emptyContactsAttributes?: boolean;
	}): Promise<{ processId: number }> {
		return brevoFetch<{ processId: number }>('/contacts/import', {
			method: 'POST',
			body: payload,
		});
	},
};

// ═══════════════════════════════════════════════════════
// LISTS API
// ═══════════════════════════════════════════════════════

export const brevoLists = {
	/**
	 * Create a new contact list
	 */
	async create(payload: BrevoListPayload): Promise<{ id: number }> {
		return brevoFetch<{ id: number }>('/contacts/lists', {
			method: 'POST',
			body: payload,
		});
	},

	/**
	 * Get list by ID
	 */
	async get(listId: number): Promise<BrevoListResponse> {
		return brevoFetch<BrevoListResponse>(`/contacts/lists/${listId}`);
	},

	/**
	 * Get all lists
	 */
	async getAll(
		options: { limit?: number; offset?: number } = {},
	): Promise<{ lists: BrevoListResponse[]; count: number }> {
		const params = new URLSearchParams();
		if (options.limit) params.set('limit', String(options.limit));
		if (options.offset) params.set('offset', String(options.offset));
		const query = params.toString();
		return brevoFetch<{ lists: BrevoListResponse[]; count: number }>(
			`/contacts/lists${query ? `?${query}` : ''}`,
		);
	},

	/**
	 * Update a list
	 */
	async update(listId: number, payload: { name?: string; folderId?: number }): Promise<void> {
		return brevoFetch<void>(`/contacts/lists/${listId}`, {
			method: 'PUT',
			body: payload,
		});
	},

	/**
	 * Delete a list
	 */
	async delete(listId: number): Promise<void> {
		return brevoFetch<void>(`/contacts/lists/${listId}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Get contacts in a list
	 */
	async getContacts(
		listId: number,
		options: { limit?: number; offset?: number; modifiedSince?: string } = {},
	): Promise<{ contacts: BrevoContactResponse[]; count: number }> {
		const params = new URLSearchParams();
		if (options.limit) params.set('limit', String(options.limit));
		if (options.offset) params.set('offset', String(options.offset));
		if (options.modifiedSince) params.set('modifiedSince', options.modifiedSince);
		const query = params.toString();
		return brevoFetch<{ contacts: BrevoContactResponse[]; count: number }>(
			`/contacts/lists/${listId}/contacts${query ? `?${query}` : ''}`,
		);
	},
};

// ═══════════════════════════════════════════════════════
// CAMPAIGNS API
// ═══════════════════════════════════════════════════════

export const brevoCampaigns = {
	/**
	 * Create a new email campaign
	 */
	async create(payload: BrevoCampaignPayload): Promise<{ id: number }> {
		return brevoFetch<{ id: number }>('/emailCampaigns', {
			method: 'POST',
			body: payload,
		});
	},

	/**
	 * Get campaign by ID
	 */
	async get(campaignId: number): Promise<BrevoCampaignResponse> {
		return brevoFetch<BrevoCampaignResponse>(`/emailCampaigns/${campaignId}`);
	},

	/**
	 * Get all campaigns
	 */
	async getAll(
		options: {
			type?: 'classic' | 'trigger';
			status?: 'draft' | 'sent' | 'archive' | 'queued' | 'suspended' | 'in_process';
			limit?: number;
			offset?: number;
		} = {},
	): Promise<{ campaigns: BrevoCampaignResponse[]; count: number }> {
		const params = new URLSearchParams();
		if (options.type) params.set('type', options.type);
		if (options.status) params.set('status', options.status);
		if (options.limit) params.set('limit', String(options.limit));
		if (options.offset) params.set('offset', String(options.offset));
		const query = params.toString();
		return brevoFetch<{ campaigns: BrevoCampaignResponse[]; count: number }>(
			`/emailCampaigns${query ? `?${query}` : ''}`,
		);
	},

	/**
	 * Update a campaign (only draft campaigns)
	 */
	async update(campaignId: number, payload: Partial<BrevoCampaignPayload>): Promise<void> {
		return brevoFetch<void>(`/emailCampaigns/${campaignId}`, {
			method: 'PUT',
			body: payload,
		});
	},

	/**
	 * Delete a campaign
	 */
	async delete(campaignId: number): Promise<void> {
		return brevoFetch<void>(`/emailCampaigns/${campaignId}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Send a campaign immediately
	 */
	async sendNow(campaignId: number): Promise<void> {
		return brevoFetch<void>(`/emailCampaigns/${campaignId}/sendNow`, {
			method: 'POST',
		});
	},

	/**
	 * Schedule a campaign
	 */
	async schedule(campaignId: number, scheduledAt: string): Promise<void> {
		return brevoFetch<void>(`/emailCampaigns/${campaignId}/schedule`, {
			method: 'POST',
			body: { scheduledAt },
		});
	},

	/**
	 * Get campaign statistics
	 */
	async getStats(campaignId: number): Promise<BrevoCampaignStats> {
		return brevoFetch<BrevoCampaignStats>(`/emailCampaigns/${campaignId}/statistics`);
	},

	/**
	 * Send a test email
	 */
	async sendTest(campaignId: number, emailTo: string[]): Promise<void> {
		return brevoFetch<void>(`/emailCampaigns/${campaignId}/sendTest`, {
			method: 'POST',
			body: { emailTo },
		});
	},
};

// ═══════════════════════════════════════════════════════
// TEMPLATES API
// ═══════════════════════════════════════════════════════

export const brevoTemplates = {
	/**
	 * Create a new email template
	 */
	async create(payload: BrevoTemplatePayload): Promise<{ id: number }> {
		return brevoFetch<{ id: number }>('/smtp/templates', {
			method: 'POST',
			body: payload,
		});
	},

	/**
	 * Get template by ID
	 */
	async get(templateId: number): Promise<BrevoTemplateResponse> {
		return brevoFetch<BrevoTemplateResponse>(`/smtp/templates/${templateId}`);
	},

	/**
	 * Get all templates
	 */
	async getAll(
		options: { templateStatus?: boolean; limit?: number; offset?: number } = {},
	): Promise<{ templates: BrevoTemplateResponse[]; count: number }> {
		const params = new URLSearchParams();
		if (options.templateStatus !== undefined)
			params.set('templateStatus', String(options.templateStatus));
		if (options.limit) params.set('limit', String(options.limit));
		if (options.offset) params.set('offset', String(options.offset));
		const query = params.toString();
		return brevoFetch<{ templates: BrevoTemplateResponse[]; count: number }>(
			`/smtp/templates${query ? `?${query}` : ''}`,
		);
	},

	/**
	 * Update a template
	 */
	async update(templateId: number, payload: Partial<BrevoTemplatePayload>): Promise<void> {
		return brevoFetch<void>(`/smtp/templates/${templateId}`, {
			method: 'PUT',
			body: payload,
		});
	},

	/**
	 * Delete a template
	 */
	async delete(templateId: number): Promise<void> {
		return brevoFetch<void>(`/smtp/templates/${templateId}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Send a test template
	 */
	async sendTest(templateId: number, emailTo: string[]): Promise<void> {
		return brevoFetch<void>(`/smtp/templates/${templateId}/sendTest`, {
			method: 'POST',
			body: { emailTo },
		});
	},
};

// ═══════════════════════════════════════════════════════
// TRANSACTIONAL SMTP API
// ═══════════════════════════════════════════════════════

export const brevoSmtp = {
	/**
	 * Send a transactional email (immediate delivery)
	 * Use this for welcome emails, confirmations, password resets, etc.
	 */
	async send(payload: BrevoTransactionalEmailPayload): Promise<BrevoTransactionalEmailResponse> {
		return brevoFetch<BrevoTransactionalEmailResponse>('/smtp/email', {
			method: 'POST',
			body: payload,
		});
	},

	/**
	 * Send a transactional email using a Brevo template
	 * Shorthand for template-based emails with params
	 *
	 * @param templateId - The Brevo template ID (from Brevo dashboard)
	 * @param to - Recipient email and optional name
	 * @param params - Variables to inject into the template (e.g., { firstName: 'John' })
	 * @param options - Additional options (sender, tags, replyTo)
	 */
	async sendTemplate(
		templateId: number,
		to: { email: string; name?: string },
		params: Record<string, unknown>,
		options: {
			sender?: { name: string; email: string };
			tags?: string[];
			replyTo?: { email: string; name?: string };
		} = {},
	): Promise<BrevoTransactionalEmailResponse> {
		const defaultSender = {
			name: process.env.BREVO_SENDER_NAME || 'GRUPOUS',
			email: process.env.BREVO_SENDER_EMAIL || 'suporte@drasacha.com.br',
		};

		return brevoFetch<BrevoTransactionalEmailResponse>('/smtp/email', {
			method: 'POST',
			body: {
				templateId,
				to: [to],
				params,
				sender: options.sender || defaultSender,
				tags: options.tags,
				replyTo: options.replyTo,
			},
		});
	},

	/**
	 * Send a simple HTML email (no template)
	 * Useful for quick one-off emails or when templates aren't configured
	 */
	async sendHtml(
		to: { email: string; name?: string },
		subject: string,
		htmlContent: string,
		options: {
			sender?: { name: string; email: string };
			tags?: string[];
			replyTo?: { email: string; name?: string };
		} = {},
	): Promise<BrevoTransactionalEmailResponse> {
		const defaultSender = {
			name: process.env.BREVO_SENDER_NAME || 'GRUPOUS',
			email: process.env.BREVO_SENDER_EMAIL || 'suporte@drasacha.com.br',
		};

		return brevoFetch<BrevoTransactionalEmailResponse>('/smtp/email', {
			method: 'POST',
			body: {
				to: [to],
				subject,
				htmlContent,
				sender: options.sender || defaultSender,
				tags: options.tags,
				replyTo: options.replyTo,
			},
		});
	},
};

// ═══════════════════════════════════════════════════════
// WEBHOOK HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Normalize Brevo webhook event types to our internal format
 */
export function normalizeEventType(
	brevoEventType: BrevoWebhookEventType,
): 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam' | 'unsubscribed' {
	switch (brevoEventType) {
		case 'delivered':
			return 'delivered';
		case 'opened':
			return 'opened';
		case 'click':
			return 'clicked';
		case 'soft_bounce':
		case 'hard_bounce':
			return 'bounced';
		case 'complaint':
			return 'spam';
		case 'unsubscribed':
			return 'unsubscribed';
		default:
			// For other events like 'invalid_email', 'deferred', 'blocked', 'error'
			// treat them as bounces for simplicity
			return 'bounced';
	}
}

/**
 * Validate webhook signature (if using signed webhooks)
 * Note: Brevo doesn't provide standard signature validation,
 * so we use a shared secret approach
 */
export function validateWebhookSecret(providedSecret: string | null): boolean {
	const expectedSecret = process.env.BREVO_WEBHOOK_SECRET;

	if (!expectedSecret) {
		return true; // Skip validation if not configured
	}

	return providedSecret === expectedSecret;
}
