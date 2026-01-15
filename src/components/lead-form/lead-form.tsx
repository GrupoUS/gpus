import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { type DefaultValues, type Resolver, type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { api } from '../../../convex/_generated/api';
import { LeadFormFields } from './lead-form-fields';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cleanPhoneNumber } from '@/lib/utils/phone-mask';
import { useUTMParams } from '@/lib/utils/utm-capture';
import { type LeadCaptureFormData, leadCaptureSchema } from '@/lib/validations/lead-capture-schema';

interface LeadFormProps {
	className?: string;
	defaultSource?: string;
}

export function LeadForm({ className, defaultSource = 'landing_page' }: LeadFormProps) {
	const [isSuccess, setIsSuccess] = useState(false);
	const createMarketingLead = useMutation(api.marketingLeads.create);
	const utmParams = useUTMParams();

	const form = useForm<LeadCaptureFormData>({
		resolver: zodResolver(leadCaptureSchema) as Resolver<LeadCaptureFormData>,
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
		} satisfies DefaultValues<LeadCaptureFormData>,
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
				phone: cleanPhoneNumber(data.phone),
				interest: data.interest,
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
			<div className="rounded-xl border bg-card p-8 text-center shadow-sm">
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="flex flex-col items-center justify-center space-y-4"
				>
					<div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
						<CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
					</div>
					<h3 className="text-2xl font-bold">Sucesso!</h3>
					<p className="text-muted-foreground">
						Recebemos seus dados e entraremos em contato em breve.
					</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => {
							setIsSuccess(false);
							form.reset();
						}}
					>
						Enviar nova mensagem
					</Button>
				</motion.div>
			</div>
		);
	}

	return (
		<div className={className}>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<LeadFormFields control={form.control} disabled={form.formState.isSubmitting} />

					{/* Hidden Honeypot Field */}
					<FormField
						control={form.control}
						name="honeypot"
						render={({ field }) => (
							<FormItem className="hidden">
								<FormControl>
									<Input {...field} tabIndex={-1} autoComplete="off" />
								</FormControl>
							</FormItem>
						)}
					/>

					<Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Enviar Solicitação
					</Button>
				</form>
			</Form>
		</div>
	);
}
