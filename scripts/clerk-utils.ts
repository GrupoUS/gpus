/**
 * Shared utilities for Clerk API scripts
 * Common constants and functions used across multiple Clerk-related scripts
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
	console.error('\n❌ ERRO: CLERK_SECRET_KEY não encontrada nas variáveis de ambiente.');
	console.error(
		'Certifique-se de que a variável CLERK_SECRET_KEY está configurada no seu terminal ou arquivo .env.local\n',
	);
	process.exit(1);
}

export const CLERK_API_URL = 'https://api.clerk.com/v1';

export const USER_ID = 'user_36rPetU2FCZFvOFyhzxBQrEMTZ6';
export const USER_EMAIL = 'msm.jur@gmail.com';
export const ORGANIZATION_ID = 'org_3744yWknE4NtI6EtvJqYT8h0MLN';

export async function clerkRequest(endpoint: string, method: string = 'GET', body?: any) {
	const response = await fetch(`${CLERK_API_URL}${endpoint}`, {
		method,
		headers: {
			Authorization: `Bearer ${CLERK_SECRET_KEY}`,
			'Content-Type': 'application/json',
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Clerk API error: ${response.status} - ${error}`);
	}

	return response.json();
}

export async function listJwtTemplates() {
	try {
		const result = await clerkRequest('/jwt_templates');
		return result.data || [];
	} catch (error: any) {
		console.log('⚠️ Erro ao listar JWT Templates:', error.message);
		return [];
	}
}
