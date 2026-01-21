/**
 * Script para criar o JWT Template "convex" no Clerk
 * Executa: bun run scripts/create-jwt-template.ts
 */

import { clerkRequest, listJwtTemplates } from './clerk-utils.js';

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
		if (
			error.message.includes('already exists') ||
			error.message.includes('409') ||
			error.message.includes('422')
		) {
			console.log('⏭️ JWT Template "convex" já existe. Atualizando...\n');
			return await updateJwtTemplate();
		}
		console.error('❌ Erro ao criar JWT Template:', error.message);
		process.exit(1);
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

void main();
