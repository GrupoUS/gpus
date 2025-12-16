/**
 * LGPD (Lei Geral de Proteção de Dados) Compliance Utilities
 * 
 * Implements Brazilian data protection law requirements for
 * handling personal data in educational CRM systems.
 */

import { v } from 'convex/values'

/**
 * LGPD Consent Types for Data Processing
 */
export const LGPD_CONSENT_TYPES = {
	ACADEMIC_PROCESSING: 'academic_processing',
	MARKETING_COMMUNICATIONS: 'marketing_communications',
	DATA_SHARING: 'data_sharing',
	ANALYTICS: 'analytics',
	PROFILE_STORAGE: 'profile_storage',
	CERTIFICATION_PROOF: 'certification_proof',
} as const

/**
 * LGPD Data Subject Rights
 */
export const LGPD_RIGHTS = {
	ACCESS: 'access',
	CORRECTION: 'correction',
	DELETION: 'deletion',
	PORTABILITY: 'portability',
	INFORMATION: 'information',
	OBJECTIVE: 'objective',
} as const

/**
 * LGPD Data Categories
 */
export const LGPD_DATA_CATEGORIES = {
	IDENTIFICATION: 'identification',
	CONTACT: 'contact',
	PROFESSIONAL: 'professional',
	FINANCIAL: 'financial',
	ACADEMIC: 'academic',
	HEALTH: 'health',
	BIOMETRIC: 'biometric',
	GEOLOCATION: 'geolocation',
} as const

/**
 * Zod schema for LGPD consent records
 */
export const consentRecordSchema = v.object({
	id: v.id('lgpdConsent'),
	studentId: v.id('students'),
	consentType: v.string(),
	consentVersion: v.string(),
	granted: v.boolean(),
	grantedAt: v.number(),
	expiresAt: v.optional(v.number()),
	ipAddress: v.optional(v.string()),
	userAgent: v.optional(v.string()),
	justification: v.optional(v.string()),
	dataCategories: v.array(v.string()),
	rightsWithdrawal: v.boolean(),
})

/**
 * Zod schema for LGPD audit log
 */
export const auditLogSchema = v.object({
	id: v.id('lgpdAudit'),
	studentId: v.optional(v.id('students')),
	actionType: v.union(
		v.literal('data_access'),
		v.literal('data_creation'),
		v.literal('data_modification'),
		v.literal('data_deletion'),
		v.literal('consent_granted'),
		v.literal('consent_withdrawn'),
		v.literal('data_export'),
		v.literal('data_portability')
	),
	actorId: v.string(),
	actorRole: v.optional(v.string()),
	dataCategory: v.string(),
	description: v.string(),
	ipAddress: v.optional(v.string()),
	userAgent: v.optional(v.string()),
	processingPurpose: v.optional(v.string()),
	legalBasis: v.string(),
	retentionDays: v.optional(v.number()),
	createdAt: v.number(),
})

/**
 * Zod schema for LGPD data retention policies
 */
export const retentionPolicySchema = v.object({
	id: v.id('lgpdRetention'),
	dataCategory: v.string(),
	retentionDays: v.number(),
	legalBasis: v.string(),
	automaticDeletion: v.boolean(),
	notificationBeforeDeletion: v.number(), // days
	requiresExplicitConsent: v.boolean(),
	minorAgeRestriction: v.optional(v.number()),
})

/**
 * Generates LGPD-compliant consent text
 */
export function generateConsentText(
	consentType: string,
	dataCategories: string[],
	processingPurpose: string,
	retentionDays: number
): string {
	const baseText = `Conforme a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), 
	autorizo o tratamento de meus dados pessoais para as seguintes finalidades:`
	
	const categoriesText = dataCategories.map(category => {
		const descriptions: Record<string, string> = {
			[LGPD_DATA_CATEGORIES.IDENTIFICATION]: 'identificação (nome, CPF, e-mail)',
			[LGPD_DATA_CATEGORIES.CONTACT]: 'contato (telefone, endereço)',
			[LGPD_DATA_CATEGORIES.PROFESSIONAL]: 'dados profissionais (formação, área de atuação)',
			[LGPD_DATA_CATEGORIES.FINANCIAL]: 'dados financeiros (informações de pagamento)',
			[LGPD_DATA_CATEGORIES.ACADEMIC]: 'dados acadêmicos (histórico, certificados)',
			[LGPD_DATA_CATEGORIES.HEALTH]: 'dados de saúde (procedimentos estéticos)',
		}
		return descriptions[category] || category
	}).join(', ')
	
	const retentionText = `Seus dados serão armazenados por ${retentionDays} dias, 
	exceto quando houver obrigação legal ou contratual de manutenção.`
	
	const rightsText = `Você tem direito de acesso, correção, exclusão, 
	portabilidade e informações sobre o compartilhamento de seus dados, 
	conforme previsto nos artigos 18 e 20 da LGPD.`
	
	const withdrawalText = `Esta autorização pode ser revogada a qualquer momento, 
	sem efeitos retroativos.`
	
	return `${baseText}\n\n${processingPurpose}\n\n${categoriesText}\n\n${retentionText}\n\n${rightsText}\n\n${withdrawalText}`
}

/**
 * Validates if a student is under 18 (minor data protection)
 */
export function isMinor(birthDate: number | string): boolean {
	const birth = typeof birthDate === 'string' ? new Date(birthDate) : new Date(birthDate)
	const today = new Date()
	const age = today.getFullYear() - birth.getFullYear()
	const monthDiff = today.getMonth() - birth.getMonth()
	
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		return age - 1 < 18
	}
	
	return age < 18
}

/**
 * Generates LGPD-compliant data export format
 */
export function generateDataExport(
	studentData: any,
	consents: any[],
	auditLog: any[]
): string {
	const exportData = {
		metadata: {
			exportDate: new Date().toISOString(),
			lgpdVersion: 'Lei 13.709/2018',
			requestId: Math.random().toString(36).substr(2, 9),
		},
		dataSubject: {
			name: studentData.name,
			email: studentData.email,
			phone: studentData.phone,
			// CPF included only with explicit consent
			cpf: hasConsentForDataCategory(consents, LGPD_DATA_CATEGORIES.IDENTIFICATION) 
				? studentData.cpf 
				: '[REDACTED BY CONSENT]',
		},
		dataProcessing: {
			purposes: consents.map(c => c.consentType),
			dataCategories: consents.flatMap(c => c.dataCategories || []),
			legalBasis: 'consentimento explícito',
			retentionPolicies: getRetentionPolicies(),
		},
		consents: consents.map(consent => ({
			type: consent.consentType,
			granted: consent.granted,
			grantedAt: new Date(consent.grantedAt).toISOString(),
			expiresAt: consent.expiresAt ? new Date(consent.expiresAt).toISOString() : null,
			withdrawn: consent.rightsWithdrawal,
		})),
		auditHistory: auditLog.map(log => ({
			action: log.actionType,
			date: new Date(log.createdAt).toISOString(),
			actor: log.actorId,
			purpose: log.processingPurpose,
		})),
		rights: {
			access: true,
			correction: true,
			deletion: true,
			portability: true,
			information: true,
			objective: true,
		},
	}
	
	return JSON.stringify(exportData, null, 2)
}

/**
 * Checks if student has given consent for specific data category
 */
export function hasConsentForDataCategory(
	consents: any[],
	dataCategory: string
): boolean {
	return consents.some(consent => 
		consent.granted &&
		!consent.rightsWithdrawal &&
		consent.dataCategories?.includes(dataCategory)
	)
}

/**
 * Calculates data retention period based on LGPD requirements
 */
export function calculateRetentionDays(
	dataCategory: string,
	studentStatus: string
): number {
	const retentionRules: Record<string, Record<string, number>> = {
		[LGPD_DATA_CATEGORIES.IDENTIFICATION]: {
			ativo: 365 * 5, // 5 years while active
			inativo: 365 * 2, // 2 years after inactivity
			formado: 365 * 7, // 7 years after graduation
		},
		[LGPD_DATA_CATEGORIES.ACADEMIC]: {
			ativo: 365 * 10, // 10 years (educational requirements)
			inativo: 365 * 5, // 5 years
			formado: 365 * 20, // 20 years (permanent certificate requirements)
		},
		[LGPD_DATA_CATEGORIES.FINANCIAL]: {
			ativo: 365 * 5, // 5 years (fiscal requirements)
			inativo: 365 * 5, // 5 years
			formado: 365 * 5, // 5 years
		},
		[LGPD_DATA_CATEGORIES.CONTACT]: {
			ativo: 365 * 3, // 3 years
			inativo: 365 * 1, // 1 year
			formado: 365 * 2, // 2 years
		},
	}
	
	const rules = retentionRules[dataCategory]
	if (!rules || !rules[studentStatus]) {
		return 365 * 2 // Default: 2 years
	}
	
	return rules[studentStatus]
}

/**
 * Generates privacy policy text according to LGPD
 */
export function generatePrivacyPolicyText(): string {
	return `
POLÍTICA DE PRIVACIDADE - CONFORME LGPD

Esta Política de Privacidade descreve como coletamos, usamos, armazenamos 
e protegemos seus dados pessoais, em conformidade com a Lei Geral de 
Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).

1. DADOS COLETADOS
Coletamos as seguintes categorias de dados:
- Dados de identificação: nome, CPF, e-mail
- Dados de contato: telefone, endereço
- Dados profissionais: formação, área de atuação
- Dados acadêmicos: histórico, certificados, progresso
- Dados financeiros: informações de pagamento
- Dados de saúde: procedimentos estéticos realizados

2. FINALIDADES DO TRATAMENTO
Seus dados são tratados para:
- Gerenciamento de matrículas e progresso acadêmico
- Emissão de certificados e históricos
- Comunicação sobre cursos e eventos
- Suporte pedagógico e administrativo
- Cumprimento de obrigações legais e contratuais

3. BASE LEGAL
O tratamento de seus dados se baseia no seu consentimento explícito, 
conforme o Art. 7, I, da LGPD.

4. COMPARTILHAMENTO DE DADOS
Compartilhamos dados apenas quando:
- Exigido por lei ou determinação judicial
- Essencial para a prestação dos serviços educacionais
- Com seu consentimento explícito

5. SEGURANÇA
Adotamos medidas técnicas e administrativas para proteger seus dados, 
incluindo criptografia e controle de acesso.

6. SEUS DIREITOS (ART. 18 DA LGPD)
Você tem direito de:
- Confirmar a existência de tratamento
- Acessar seus dados
- Corrigir dados incompletos, inexatos ou desatualizados
- Solicitar a eliminação de dados desnecessários
- Portar seus dados para outro fornecedor
- Informar sobre compartilhamento
- Revogar o consentimento

7. ARMAZENAMENTO E ELIMINAÇÃO
Seus dados são armazenados pelo período mínimo necessário e eliminados 
após expirar o prazo de retenção, exceto se houver obrigação legal.

8. CONTATO
Para exercer seus direitos, entre em contato com nosso Encarregado 
de Proteção de Dados através do e-mail: dpo@portalgrupo.us

Esta política foi atualizada em ${new Date().toLocaleDateString('pt-BR')}.
	`.trim()
}

/**
 * Helper function to get retention policies
 */
function getRetentionPolicies() {
	return {
		[LGPD_DATA_CATEGORIES.IDENTIFICATION]: '5 anos enquanto ativo, 2 anos após inatividade',
		[LGPD_DATA_CATEGORIES.ACADEMIC]: '10 anos enquanto ativo, 20 anos após formatura',
		[LGPD_DATA_CATEGORIES.FINANCIAL]: '5 anos (obrigações fiscais)',
		[LGPD_DATA_CATEGORIES.CONTACT]: '3 anos enquanto ativo, 1 ano após inatividade',
	}
}
