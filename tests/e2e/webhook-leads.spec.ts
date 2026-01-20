import { expect, test } from '@playwright/test';

// Configuration
const WEBHOOK_URL = 'http://localhost:3210/webhook/leads'; // Default Convex HTTP Action URL
const TEST_SECRET = process.env.WEBHOOK_SECRET || 'dev-secret'; // Ensure this matches your dev env

test.describe('Webhook Leads API', () => {
	test('should reject requests without secret', async ({ request }) => {
		const response = await request.post(WEBHOOK_URL, {
			data: {
				email: 'test@example.com',
				source: 'test',
			},
		});
		expect(response.status()).toBe(401);
	});

	test('should reject requests with invalid secret', async ({ request }) => {
		const response = await request.post(WEBHOOK_URL, {
			headers: {
				'X-Webhook-Secret': 'wrong-secret',
			},
			data: {
				email: 'test@example.com',
				source: 'test',
			},
		});
		expect(response.status()).toBe(401);
	});

	test('should validate required fields', async ({ request }) => {
		const response = await request.post(WEBHOOK_URL, {
			headers: {
				'X-Webhook-Secret': TEST_SECRET,
			},
			data: {
				// Missing email and source
				name: 'Incomplete Lead',
			},
		});
		expect(response.status()).toBe(400);
		const body = await response.json();
		expect(body.error).toContain('Missing required fields');
	});

	test('should process valid lead with landing page', async ({ request }) => {
		const leadData = {
			email: `e2e-test-${Date.now()}@test.com`,
			source: 'e2e_test',
			name: 'E2E Test User',
			landingPage: 'test-landing-page-v1',
			landingPageUrl: 'https://example.com/promo',
			utmSource: 'playwright',
			utmMedium: 'test',
		};

		const response = await request.post(WEBHOOK_URL, {
			headers: {
				'X-Webhook-Secret': TEST_SECRET,
			},
			data: leadData,
		});

		expect(response.status()).toBe(200);
		const body = await response.json();
		expect(body.success).toBe(true);
		expect(body).toHaveProperty('leadId'); // Assuming mutation returns ID or object with ID
	});

	test('GET /test should validate configuration', async ({ request }) => {
		const response = await request.get(`${WEBHOOK_URL}/test`, {
			headers: {
				'X-Webhook-Secret': TEST_SECRET,
			},
		});

		expect(response.status()).toBe(200);
		const body = await response.json();
		expect(body.status).toBe('ok');
		expect(body).toHaveProperty('expectedPayload');
	});
});
