/**
 * Script para configurar Roles e Permissões no Clerk
 * Requer: CLERK_SECRET_KEY configurado no ambiente
 * Executa: bun run scripts/setup-clerk-roles.ts
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

interface Permission {
	key: string;
	name: string;
	description: string;
}

interface Role {
	key: string;
	name: string;
	description: string;
	permissions: string[];
}

// Permissões baseadas na página settings/roles
// Clerk requer formato: org:<segment1>:<segment2>
// Usamos formato: org:resource_action:resource_action para consistência
const PERMISSIONS: Permission[] = [
	// Leads
	{
		key: 'org:leads_read:leads_read',
		name: 'Leads: Leitura',
		description: 'Visualizar leads e informações de prospects',
	},
	{
		key: 'org:leads_write:leads_write',
		name: 'Leads: Escrita',
		description: 'Criar, editar e gerenciar leads',
	},

	// Conversations
	{
		key: 'org:conversations_read:conversations_read',
		name: 'Conversas: Leitura',
		description: 'Visualizar conversas e mensagens',
	},
	{
		key: 'org:conversations_write:conversations_write',
		name: 'Conversas: Escrita',
		description: 'Enviar mensagens e gerenciar conversas',
	},

	// Students
	{
		key: 'org:students_read:students_read',
		name: 'Alunos: Leitura',
		description: 'Visualizar informações de alunos',
	},
	{
		key: 'org:students_write:students_write',
		name: 'Alunos: Escrita',
		description: 'Criar, editar e gerenciar alunos',
	},

	// Tickets
	{
		key: 'org:tickets_read:tickets_read',
		name: 'Tickets: Leitura',
		description: 'Visualizar tickets de suporte',
	},
	{
		key: 'org:tickets_write:tickets_write',
		name: 'Tickets: Escrita',
		description: 'Criar e gerenciar tickets de suporte',
	},

	// Reports
	{
		key: 'org:reports_read:reports_read',
		name: 'Relatórios: Leitura',
		description: 'Visualizar relatórios e métricas',
	},
];

// Roles baseadas na página settings/roles
// Permissões devem usar as keys do Clerk (formato org:resource_action:resource_action)
const ROLES: Role[] = [
	{
		key: 'org:sdr',
		name: 'SDR (Vendas)',
		description: 'Focado em gestão de leads, CRM e conversas de vendas.',
		permissions: [
			'org:leads_read:leads_read',
			'org:leads_write:leads_write',
			'org:conversations_read:conversations_read',
			'org:conversations_write:conversations_write',
			'org:students_read:students_read',
		],
	},
	{
		key: 'org:cs',
		name: 'Customer Success',
		description: 'Gestão de alunos, monitoramento de progresso e suporte.',
		permissions: [
			'org:students_read:students_read',
			'org:students_write:students_write',
			'org:conversations_read:conversations_read',
			'org:conversations_write:conversations_write',
			'org:reports_read:reports_read',
		],
	},
	{
		key: 'org:support',
		name: 'Suporte',
		description: 'Atendimento de tickets e resolução de problemas técnicos.',
		permissions: [
			'org:conversations_read:conversations_read',
			'org:conversations_write:conversations_write',
			'org:tickets_read:tickets_read',
			'org:tickets_write:tickets_write',
			'org:students_read:students_read',
		],
	},
];

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

async function listExistingPermissions() {
	try {
		const result = await clerkRequest('/organization_permissions');
		console.log('📋 Permissões existentes:', result);
		return result.data || [];
	} catch (error) {
		console.log('⚠️ Nenhuma permissão existente ou erro ao listar');
		return [];
	}
}

async function listExistingRoles() {
	try {
		const result = await clerkRequest('/organization_roles');
		console.log('📋 Roles existentes:', result);
		return result.data || [];
	} catch (error) {
		console.log('⚠️ Nenhuma role existente ou erro ao listar');
		return [];
	}
}

async function createPermission(permission: Permission) {
	try {
		const result = await clerkRequest('/organization_permissions', 'POST', {
			key: permission.key,
			name: permission.name,
			description: permission.description,
		});
		console.log(`✅ Permissão criada: ${permission.key}`);
		return result;
	} catch (error: any) {
		if (error.message.includes('already exists') || error.message.includes('409')) {
			console.log(`⏭️ Permissão já existe: ${permission.key}`);
		} else {
			console.error(`❌ Erro ao criar permissão ${permission.key}:`, error.message);
		}
	}
}

async function getPermissionIds(permissionKeys: string[]): Promise<string[]> {
	const existingPermissions = await listExistingPermissions();
	const permissionIds: string[] = [];

	for (const key of permissionKeys) {
		const perm = existingPermissions.find((p: any) => p.key === key);
		if (perm) {
			permissionIds.push(perm.id);
		} else {
			console.warn(`⚠️ Permissão não encontrada: ${key}`);
		}
	}

	return permissionIds;
}

async function createRole(role: Role) {
	try {
		// Converter permission keys para IDs antes de criar
		const permissionIds = await getPermissionIds(role.permissions);

		if (permissionIds.length === 0) {
			console.warn(`⚠️ Nenhuma permissão encontrada para role ${role.key}, pulando criação`);
			return;
		}

		const result = await clerkRequest('/organization_roles', 'POST', {
			key: role.key,
			name: role.name,
			description: role.description,
			permissions: permissionIds,
		});
		console.log(`✅ Role criada: ${role.key}`);
		return result;
	} catch (error: any) {
		if (
			error.message.includes('already exists') ||
			error.message.includes('409') ||
			error.message.includes('404') ||
			error.message.includes('422') ||
			error.message.includes('taken')
		) {
			console.log(`⏭️ Role já existe: ${role.key} - tentando atualizar permissões...`);
			// Tentar atualizar permissões da role existente
			await updateRolePermissions(role);
		} else {
			console.error(`❌ Erro ao criar role ${role.key}:`, error.message);
		}
	}
}

async function updateRolePermissions(role: Role) {
	try {
		// Buscar role existente
		const roles = await listExistingRoles();
		const existingRole = roles.find((r: any) => r.key === role.key);

		if (existingRole) {
			// Converter permission keys para IDs
			const permissionIds = await getPermissionIds(role.permissions);

			if (permissionIds.length === 0) {
				console.warn(`⚠️ Nenhuma permissão encontrada para role ${role.key}`);
				return;
			}

			const result = await clerkRequest(`/organization_roles/${existingRole.id}`, 'PATCH', {
				permissions: permissionIds,
			});
			console.log(
				`✅ Permissões atualizadas para role: ${role.key} (${permissionIds.length} permissões)`,
			);
			return result;
		}
	} catch (error: any) {
		console.error(`❌ Erro ao atualizar permissões da role ${role.key}:`, error.message);
	}
}

async function main() {
	console.log('🚀 Iniciando configuração de Roles e Permissões no Clerk\n');

	// 1. Listar estado atual
	console.log('📊 Verificando estado atual...\n');
	await listExistingPermissions();
	await listExistingRoles();

	// 2. Criar permissões
	console.log('\n🔑 Criando permissões...\n');
	for (const permission of PERMISSIONS) {
		await createPermission(permission);
	}

	// 3. Criar roles com permissões
	console.log('\n👤 Criando roles...\n');
	for (const role of ROLES) {
		await createRole(role);
	}

	// 4. Verificar resultado final
	console.log('\n📊 Estado final:\n');
	await listExistingPermissions();
	await listExistingRoles();

	console.log('\n✅ Configuração concluída!');
	console.log('\n📝 Próximos passos:');
	console.log('   1. Acesse o Clerk Dashboard para verificar as configurações');
	console.log('   2. Configure o JWT Template para incluir org_permissions');
	console.log('   3. Atribua roles aos membros da organização');
}

main().catch(console.error);
