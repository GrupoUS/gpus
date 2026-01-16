/**
 * Script para criar o JWT Template "convex" no Clerk
 * Executa: bun run scripts/create-jwt-template.ts
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
	console.error('\n❌ ERRO: CLERK_SECRET_KEY não encontrada nas variáveis de ambiente.');
	console.error(
		'Certifique-se de que a variável CLERK_SECRET_KEY está configurada no seu terminal ou arquivo .env.local\n',
	);
	process.exit(1);
}

const CLERK_API_URL = 'https://api.clerk.com/v1';

async function clerkRequest(endpoint: string, method: string = 'GET', body?: any) {
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

async function createJwtTemplate() {
	try {
		console.log('🚀 Criando JWT Template "convex"...\n');

		const template = await clerkRequest('/jwt_templates', 'POST', {
			name: 'convex',
			claims: {
				org_id: '{{org.id}}',
				org_role: '{{org.role}}',
				org_slug: '{{org.slug}}',
				org_permissions: '{{org.permissions}}',
			},
		});

		console.log('✅ JWT Template "convex" criado com sucesso!');
		console.log(`📋 Template ID: ${template.id}`);
		console.log(`📋 Slug: ${template.slug}`);
		console.log(`📋 Claims: ${JSON.stringify(template.claims, null, 2)}\n`);
		return template;
	} catch (error: any) {
		if (error.message.includes('already exists') || error.message.includes('409') || error.message.includes('422')) {
			console.log('⏭️ JWT Template "convex" já existe. Atualizando...\n');
			return await updateJwtTemplate();
		}
		console.error('❌ Erro ao criar JWT Template:', error.message);
		process.exit(1);
	}
}

async function listJwtTemplates() {
	try {
		const result = await clerkRequest('/jwt_templates');
		return result.data || [];
	} catch (error: any) {
		console.log('⚠️ Erro ao listar JWT Templates:', error.message);
		return [];
	}
}

async function updateJwtTemplate() {
	try {
		// List existing templates to find the one with name "convex"
		const templates = await listJwtTemplates();
		const convexTemplate = templates.find((t: any) => t.name === 'convex');

		if (!convexTemplate) {
			console.error('❌ JWT Template "convex" não encontrado!');
			process.exit(1);
		}

		const template = await clerkRequest(`/jwt_templates/${convexTemplate.id}`, 'PATCH', {
			name: 'convex',
			claims: {
				org_id: '{{org.id}}',
				org_role: '{{org.role}}',
				org_slug: '{{org.slug}}',
				org_permissions: '{{org.permissions}}',
			},
		});

		console.log('✅ JWT Template "convex" atualizado com sucesso!');
		console.log(`📋 Template ID: ${template.id}`);
		console.log(`📋 Slug: ${template.slug}`);
		console.log(`📋 Claims: ${JSON.stringify(template.claims, null, 2)}\n`);
		return template;
	} catch (error: any) {
		console.error('❌ Erro ao atualizar JWT Template:', error.message);
		process.exit(1);
	}
}

async function main() {
	console.log('🎯 Script: Criar JWT Template para Convex\n');

	await createJwtTemplate();

	console.log('✅ Configuração concluída!');
	console.log('\n📝 Próximos passos:');
	console.log('   1. Faça logout e login novamente com msm.jur@gmail.com');
	console.log('   2. No console do navegador, execute para verificar o token:');
	console.log('      ```javascript');
	console.log('      const session = await window.Clerk.session;');
	console.log('      const token = await session.getToken({ template: "convex" });');
	console.log('      const decoded = JSON.parse(atob(token.split(".")[1]));');
	console.log('      console.log("User ID:", decoded.sub);');
	console.log('      console.log("Org ID:", decoded.org_id);');
	console.log('      console.log("Org Role:", decoded.org_role);');
	console.log('      console.log("Org Permissions:", decoded.org_permissions);');
	console.log('      ```\n');
}

main();
