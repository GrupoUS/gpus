/**
 * Script para verificar a configuração do JWT Template no Clerk
 * Executa: bun run scripts/verify-jwt-template.ts
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

const USER_ID = 'user_36rPetU2FCZFvOFyhzxBQrEMTZ6';
const USER_EMAIL = 'msm.jur@gmail.com';
const ORGANIZATION_ID = 'org_3744yWknE4NtI6EtvJqYT8h0MLN';

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

async function listJwtTemplates() {
	try {
		const result = await clerkRequest('/jwt_templates');
		console.log('📋 JWT Templates encontrados:');
		if (result.data && result.data.length > 0) {
			for (const template of result.data) {
				console.log(`   - ${template.name} (${template.slug})`);
			}
			return result.data;
		} else {
			console.log('   ⚠️ Nenhum JWT Template encontrado');
			return [];
		}
	} catch (error: any) {
		console.log('⚠️ Erro ao listar JWT Templates:', error.message);
		return [];
	}
}

async function getJwtTemplate(slug: string) {
	try {
		const result = await clerkRequest(`/jwt_templates/${slug}`);
		return result;
	} catch (error: any) {
		console.log(`⚠️ Erro ao obter JWT Template "${slug}":`, error.message);
		return null;
	}
}

async function getUserToken() {
	try {
		// Buscar o usuário para obter o token
		const user = await clerkRequest(`/users/${USER_ID}`);
		console.log(`\n👤 Usuário encontrado: ${user.email_addresses[0].email_address}`);

		// Verificar se o usuário tem sessões ativas
		const sessions = await clerkRequest(`/users/${USER_ID}/sessions`);
		if (sessions.data && sessions.data.length > 0) {
			console.log(`✅ Usuário tem ${sessions.data.length} sessão(ões) ativa(s)`);
		} else {
			console.log('⚠️ Usuário não tem sessões ativas. Faça login primeiro.');
		}

		return user;
	} catch (error: any) {
		console.error('❌ Erro ao obter usuário:', error.message);
		return null;
	}
}

async function main() {
	console.log('🎯 Script: Verificar JWT Template Configuration\n');

	// Listar JWT Templates
	const templates = await listJwtTemplates();

	// Verificar se existe template "convex"
	const convexTemplate = templates.find((t: any) => t.slug === 'convex');

	if (!convexTemplate) {
		console.log('\n❌ JWT Template "convex" não encontrado!');
		console.log('\n📝 Para criar o JWT Template:');
		console.log('   1. Acesse o Clerk Dashboard: https://dashboard.clerk.com');
		console.log('   2. Vá em JWT Templates');
		console.log('   3. Clique em "Create Template"');
		console.log('   4. Nome: "convex"');
		console.log('   5. Adicione os seguintes claims customizados:');
		console.log('      ```json');
		console.log('      {');
		console.log('        "org_id": "{{org.id}}",');
		console.log('        "org_role": "{{org.role}}",');
		console.log('        "org_slug": "{{org.slug}}",');
		console.log('        "org_permissions": "{{org.permissions}}"');
		console.log('      }');
		console.log('      ```');
		console.log('   6. Salve o template\n');
		return;
	}

	console.log('\n✅ JWT Template "convex" encontrado!');
	const templateDetails = await getJwtTemplate('convex');

	if (templateDetails) {
		console.log('\n📋 Detalhes do Template:');
		console.log(`   Nome: ${templateDetails.name}`);
		console.log(`   Slug: ${templateDetails.slug}`);
		console.log(`   Claims: ${templateDetails.claims ? JSON.stringify(templateDetails.claims, null, 2) : 'Nenhum claim customizado'}`);

		// Verificar claims necessários
		const requiredClaims = ['org_id', 'org_role', 'org_slug', 'org_permissions'];
		const claims = templateDetails.claims || {};
		const missingClaims = requiredClaims.filter(claim => !claims[claim]);

		if (missingClaims.length > 0) {
			console.log(`\n⚠️ Claims faltando: ${missingClaims.join(', ')}`);
			console.log('\n📝 Para adicionar os claims:');
			console.log('   1. Acesse o Clerk Dashboard: https://dashboard.clerk.com');
			console.log('   2. Vá em JWT Templates → convex');
			console.log('   3. Adicione os seguintes claims customizados:');
			console.log('      ```json');
			console.log('      {');
			console.log('        "org_id": "{{org.id}}",');
			console.log('        "org_role": "{{org.role}}",');
			console.log('        "org_slug": "{{org.slug}}",');
			console.log('        "org_permissions": "{{org.permissions}}"');
			console.log('      }');
			console.log('      ```');
			console.log('   4. Salve o template\n');
		} else {
			console.log('\n✅ Todos os claims necessários estão configurados!');
		}
	}

	// Obter informações do usuário
	await getUserToken();

	console.log('\n✅ Verificação concluída!');
	console.log('\n📝 Próximos passos:');
	console.log('   1. Se o JWT Template não estiver configurado, configure-o conforme instruções acima');
	console.log('   2. Faça logout e login novamente com msm.jur@gmail.com');
	console.log('   3. No console do navegador, execute para verificar o token:');
	console.log('      ```javascript');
	console.log('      const session = await window.Clerk.session;');
	console.log('      const token = await session.getToken({ template: "convex" });');
	console.log('      const decoded = JSON.parse(atob(token.split(".")[1]));');
	console.log('      console.log("org_role:", decoded.org_role);');
	console.log('      console.log("org_permissions:", decoded.org_permissions);');
	console.log('      ```\n');
}

main();
