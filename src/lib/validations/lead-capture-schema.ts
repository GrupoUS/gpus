import { z } from 'zod';

export const interestOptions = [
	'Harmonização Facial',
	'Estética Corporal',
	'Bioestimuladores',
	'Outros',
] as const;

export const leadCaptureSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
	email: z.string().email('Email inválido'),
	phone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato: (11) 99999-9999'),
	interest: z.enum(interestOptions),
	message: z.string().max(500, 'Mensagem deve ter no máximo 500 caracteres').optional(),
	lgpdConsent: z.boolean().refine((val) => val === true, {
		message: 'Você deve aceitar os termos',
	}),
	whatsappConsent: z.boolean().default(false),
	// Honeypot field - should be empty
	honeypot: z.string().max(0, 'Invalid submission').optional(),

	// UTM Parameters
	utmSource: z.string().optional(),
	utmCampaign: z.string().optional(),
	utmMedium: z.string().optional(),
	utmContent: z.string().optional(),
	utmTerm: z.string().optional(),
});

export type LeadCaptureFormData = z.infer<typeof leadCaptureSchema>;
