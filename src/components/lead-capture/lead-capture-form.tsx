import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { LeadCaptureFormFields } from './lead-capture-form-fields';
import { LeadCaptureSuccess } from './lead-capture-success';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useUTMParams } from '@/lib/utils/utm-capture';
import { type LeadCaptureFormData, leadCaptureSchema } from '@/lib/validations/lead-capture-schema';

interface LeadCaptureFormProps {
	className?: string;
	defaultSource?: string;
}

export function LeadCaptureForm({
	className,
	defaultSource = 'landing_page',
}: LeadCaptureFormProps) {
	const [isSuccess, setIsSuccess] = useState(false);
	// @ts-expect-error - Migration: error TS2304
	const createMarketingLead: ReturnType<typeof useMutation> = useMutation(
		// biome-ignore lint/suspicious/noExplicitAny: avoid circular type instantiation
		// @ts-expect-error - Migration: error TS2304
		(api as any).marketingLeads.create,
	);
	const utmParams = useUTMParams();

	const form = useForm<LeadCaptureFormData>({
		resolver: zodResolver(leadCaptureSchema),
		defaultValues: {
			name: '',
			phone: '',
			email: '',
			message: '',
			// Interest is required in schema but Select needs a value.
			// Validation will catch empty string if mapped correctly or we rely on user selection.
			interest: undefined,
			lgpdConsent: false,
			whatsappConsent: false,
			honeypot: '',
			utmSource: utmParams.utmSource || defaultSource,
			utmCampaign: utmParams.utmCampaign,
			utmMedium: utmParams.utmMedium,
			utmContent: utmParams.utmContent,
			utmTerm: utmParams.utmTerm,
		},
	});

	const onSubmit: SubmitHandler<LeadCaptureFormData> = async (data) => {
		try {
			if (data.honeypot) {
				// Silently fail for bots
				setIsSuccess(true);
				return;
			}

			await createMarketingLead({
				name: data.name,
				email: data.email,
				phone: data.phone,
				// biome-ignore lint/suspicious/noExplicitAny: mismatch between Zod enum and Convex union types
				interest: data.interest as any,
				message: data.message,
				lgpdConsent: data.lgpdConsent,
				whatsappConsent: data.whatsappConsent,
				utmSource: data.utmSource,
				utmCampaign: data.utmCampaign,
				utmMedium: data.utmMedium,
				utmContent: data.utmContent,
				utmTerm: data.utmTerm,
			});

			setIsSuccess(true);
			toast.success('Solicitação recebida com sucesso!');
		} catch (_error) {
			toast.error('Erro ao enviar formulário. Tente novamente.');
		}
	};

	if (isSuccess) {
		return (
			<LeadCaptureSuccess
				onReset={() => {
					setIsSuccess(false);
					form.reset();
				}}
			/>
		);
	}

	return (
		<div className={className}>
			<Form {...form}>
				<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
					<LeadCaptureFormFields control={form.control} disabled={form.formState.isSubmitting} />

					{/* Hidden Honeypot Field */}
					<FormField
						control={form.control}
						name="honeypot"
						render={({ field }) => (
							<FormItem className="hidden">
								<FormControl>
									<Input {...field} autoComplete="off" tabIndex={-1} />
								</FormControl>
							</FormItem>
						)}
					/>

					<Button className="w-full" disabled={form.formState.isSubmitting} size="lg" type="submit">
						{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Enviar Solicitação
					</Button>
				</form>
			</Form>
		</div>
	);
}
