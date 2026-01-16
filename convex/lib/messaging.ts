/**
 * Messaging Webhook Utilities
 *
 * Handles validation and processing of external messaging webhooks
 * (e.g., WhatsApp Business API, SMS providers)
 */

/**
 * Validates the messaging webhook secret from request headers
 *
 * @param secret - The secret from X-Messaging-Secret header
 * @returns true if valid, false otherwise
 */
export function validateMessagingWebhookSecret(secret: string | null): boolean {
	const expectedSecret = process.env.MESSAGING_WEBHOOK_SECRET;

	if (!expectedSecret) {
		console.error('MESSAGING_WEBHOOK_SECRET environment variable not set');
		return false;
	}

	if (!secret) {
		return false;
	}

	// Constant-time comparison to prevent timing attacks
	if (secret.length !== expectedSecret.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < secret.length; i++) {
		result |= secret.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
	}

	return result === 0;
}

/**
 * Message status types supported by external providers
 */
export type ExternalMessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'sending';

/**
 * Maps external provider status to internal status
 */
export function normalizeMessageStatus(
	externalStatus: string,
): 'enviando' | 'enviado' | 'entregue' | 'lido' | 'falhou' {
	const statusMap: Record<string, 'enviando' | 'enviado' | 'entregue' | 'lido' | 'falhou'> = {
		sending: 'enviando',
		sent: 'enviado',
		delivered: 'entregue',
		read: 'lido',
		failed: 'falhou',
		error: 'falhou',
	};

	return statusMap[externalStatus.toLowerCase()] ?? 'falhou';
}

/**
 * Webhook payload structure from messaging providers
 */
export interface MessagingWebhookPayload {
	messageId: string;
	status: string;
	timestamp?: number;
	errorCode?: string;
	errorMessage?: string;
}
