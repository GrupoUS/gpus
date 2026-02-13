import { z } from 'zod';

const v_string_optional = z.string().optional();

export const leadSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	phone: z.string().min(10, 'Telefone inválido (mínimo 10 dígitos)'),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	message: z.string().optional(),

	// Consents - Must be checked
	lgpdConsent: z.boolean().refine((val) => val === true, {
		message: 'Você precisa concordar com a política de privacidade',
	}),
	whatsappConsent: z.boolean().default(false), // Optional but desirable? Prompt implies explicit checkboxes.

	// Context/UTM (Hidden fields usually)
	source: v_string_optional,
	sourceDetail: v_string_optional,
	utmSource: v_string_optional,
	utmCampaign: v_string_optional,
	utmMedium: v_string_optional,
	utmContent: v_string_optional,
	utmTerm: v_string_optional,
});

export type LeadFormValues = z.infer<typeof leadSchema>;
