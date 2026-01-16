/**
 * Script para adicionar usuário como Admin na organização do Clerk
 * Executa: bun run scripts/add-admin-to-org.ts
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

// Configuração do usuário e organização
const USER_ID = 'user_36rPetU2FCZFvOFyhzxBQrEMTZ6';
const USER_EMAIL = 'msm.jur@gmail.com';
const ORGANIZATION_ID = 'org_3744yWknE4NtI6EtvJqYT8h0MLN';
const ROLE = 'org:admin';

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

async function checkExistingMembership() {
	try {
		const result = await clerkRequest(`/organizations/${ORGANIZATION_ID}/memberships`);
		const membership = result.data?.find((m: any) => m.public_user_data.user_id === USER_ID);
		return membership;
	} catch (error: any) {
		console.log('⚠️ Erro ao verificar membros existentes:', error.message);
		return null;
	}
}

async function addUserToOrganization() {
	try {
		console.log('🚀 Adicionando usuário à organização...\n');
		console.log(`📧 Email: ${USER_EMAIL}`);
		console.log(`👤 User ID: ${USER_ID}`);
		console.log(`🏢 Organization ID: ${ORGANIZATION_ID}`);
		console.log(`🔑 Role: ${ROLE}\n`);

		// Verificar se o usuário já é membro
		console.log('🔍 Verificando se o usuário já é membro da organização...');
		const existingMembership = await checkExistingMembership();

		if (existingMembership) {
			console.log(`⏭️ Usuário já é membro da organização com role: ${existingMembership.role}`);

			// Verificar se a role é admin
			if (existingMembership.role === ROLE) {
				console.log('✅ Usuário já tem a role correta (Admin)');
				return;
			}

			// Atualizar role para admin
			console.log('🔄 Atualizando role para Admin...');
			await clerkRequest(`/organizations/${ORGANIZATION_ID}/memberships/${existingMembership.id}`, 'PATCH', {
				role: ROLE,
			});
			console.log('✅ Role atualizada para Admin com sucesso!');
			return;
		}

		// Adicionar usuário à organização
		console.log('➕ Adicionando usuário como membro da organização...');
		const result = await clerkRequest(`/organizations/${ORGANIZATION_ID}/memberships`, 'POST', {
			userId: USER_ID,
			role: ROLE,
		});

		console.log('✅ Usuário adicionado à organização com sucesso!');
		console.log(`📋 Membership ID: ${result.id}`);
		console.log(`🔑 Role: ${result.role}\n`);
	} catch (error: any) {
		console.error('❌ Erro ao adicionar usuário à organização:', error.message);
		process.exit(1);
	}
}

async function verifyOrganization() {
	try {
		console.log('🔍 Verificando organização...');
		const org = await clerkRequest(`/organizations/${ORGANIZATION_ID}`);
		console.log(`✅ Organização encontrada: ${org.name}`);
		console.log(`📋 Slug: ${org.slug}\n`);
	} catch (error: any) {
		console.error('❌ Erro ao verificar organização:', error.message);
		console.error('Verifique se o ORGANIZATION_ID está correto.');
		process.exit(1);
	}
}

async function main() {
	console.log('🎯 Script: Adicionar Admin à Organização\n');

	// Verificar organização
	await verifyOrganization();

	// Adicionar usuário à organização
	await addUserToOrganization();

	console.log('✅ Configuração concluída!');
	console.log('\n📝 Próximos passos:');
	console.log('   1. Configure o JWT Template no Clerk Dashboard (se ainda não configurado)');
	console.log('   2. Faça logout e login novamente com msm.jur@gmail.com');
	console.log('   3. Verifique se o usuário tem acesso completo ao sistema\n');
}

main();
