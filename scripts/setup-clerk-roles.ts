/**
 * Script para configurar Roles e Permissões no Clerk
 * Executa: bun run scripts/setup-clerk-roles.ts
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_1AumWLgSK06H6VZmLTeW5OchEauF5s6huaJnzmfrvH';
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

// Permissões baseadas na imagem da página settings/roles
const PERMISSIONS: Permission[] = [
  // Leads
  { key: 'org:leads:read', name: 'Leads: Leitura', description: 'Visualizar leads e informações de prospects' },
  { key: 'org:leads:write', name: 'Leads: Escrita', description: 'Criar, editar e gerenciar leads' },
  
  // Conversations
  { key: 'org:conversations:read', name: 'Conversas: Leitura', description: 'Visualizar conversas e mensagens' },
  { key: 'org:conversations:write', name: 'Conversas: Escrita', description: 'Enviar mensagens e gerenciar conversas' },
  
  // Students
  { key: 'org:students:read', name: 'Alunos: Leitura', description: 'Visualizar informações de alunos' },
  { key: 'org:students:write', name: 'Alunos: Escrita', description: 'Criar, editar e gerenciar alunos' },
  
  // Tickets
  { key: 'org:tickets:read', name: 'Tickets: Leitura', description: 'Visualizar tickets de suporte' },
  { key: 'org:tickets:write', name: 'Tickets: Escrita', description: 'Criar e gerenciar tickets de suporte' },
  
  // Reports
  { key: 'org:reports:read', name: 'Relatórios: Leitura', description: 'Visualizar relatórios e métricas' },
  
  // Financial (para integração Asaas)
  { key: 'org:financial:read', name: 'Financeiro: Leitura', description: 'Visualizar dados financeiros' },
  { key: 'org:financial:write', name: 'Financeiro: Escrita', description: 'Gerenciar cobranças e pagamentos' },
  
  // Settings
  { key: 'org:settings:read', name: 'Configurações: Leitura', description: 'Visualizar configurações do sistema' },
  { key: 'org:settings:write', name: 'Configurações: Escrita', description: 'Alterar configurações do sistema' },
];

// Roles baseadas na imagem da página settings/roles
const ROLES: Role[] = [
  {
    key: 'org:admin',
    name: 'Administrador',
    description: 'Acesso total a todas as funcionalidades e configurações.',
    permissions: PERMISSIONS.map(p => p.key), // Todas as permissões
  },
  {
    key: 'org:sdr',
    name: 'SDR (Vendas)',
    description: 'Focado em gestão de leads, CRM e conversas de vendas.',
    permissions: [
      'org:leads:read',
      'org:leads:write',
      'org:conversations:read',
      'org:conversations:write',
      'org:students:read',
    ],
  },
  {
    key: 'org:cs',
    name: 'Customer Success',
    description: 'Gestão de alunos, monitoramento de progresso e suporte.',
    permissions: [
      'org:students:read',
      'org:students:write',
      'org:conversations:read',
      'org:conversations:write',
      'org:reports:read',
    ],
  },
  {
    key: 'org:support',
    name: 'Suporte',
    description: 'Atendimento de tickets e resolução de problemas técnicos.',
    permissions: [
      'org:conversations:read',
      'org:conversations:write',
      'org:tickets:read',
      'org:tickets:write',
      'org:students:read',
    ],
  },
];

async function clerkRequest(endpoint: string, method: string = 'GET', body?: any) {
  const response = await fetch(`${CLERK_API_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
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

async function createRole(role: Role) {
  try {
    const result = await clerkRequest('/organization_roles', 'POST', {
      key: role.key,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
    console.log(`✅ Role criada: ${role.key}`);
    return result;
  } catch (error: any) {
    if (error.message.includes('already exists') || error.message.includes('409')) {
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
      const result = await clerkRequest(`/organization_roles/${existingRole.id}`, 'PATCH', {
        permissions: role.permissions,
      });
      console.log(`✅ Permissões atualizadas para role: ${role.key}`);
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
