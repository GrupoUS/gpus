import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { api } from '../../../convex/_generated/api';
import { LeadFormFields } from './lead-form-fields';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { type LeadFormValues, leadSchema } from '@/lib/validations/lead-schema';

interface LeadFormProps {
	className?: string;
	defaultSource?: string;
}

export function LeadForm({ className, defaultSource = 'landing_page' }: LeadFormProps) {
	const [isSuccess, setIsSuccess] = useState(false);
	const createPublicLead = useMutation(api.leads.createPublicLead);

	const form = useForm<LeadFormValues>({
		resolver: zodResolver(leadSchema) as Resolver<LeadFormValues>,
		defaultValues: {
			name: '',
			phone: '',
			email: '',
			message: '',
			lgpdConsent: false,
			whatsappConsent: false,
			source: defaultSource,
			sourceDetail: '',
		},
	});

	async function onSubmit(data: LeadFormValues) {
		try {
			// Get IP if possible, handled by Convex or middleware elsewhere usually.
			// But mutation accepts userIp. We might get it from an external service or let backend handle it via request context if using http actions.
			// Here we rely on backend rate limiting by IP if passed, but basic mutation doesn't have easy access to request IP unless passed from client or http action.
			// For now, we'll pass a placeholder or rely on browser fingerprint if needed, but simple submission is priority.

			// Note: Passing IP from client is spoofable, but 'createPublicLead' allows it for basic rate limiting logic.
			// A better way is fetching it from a service like ipify, but let's skip for simplicity unless required.

			await createPublicLead({
				...data,
				phone: data.phone.replace(/\D/g, ''), // Clean phone
				source: defaultSource, // Ensure source is set
				// userIp: ...
			});

			setIsSuccess(true);
			toast.success('Solicitação recebida com sucesso!');
		} catch (_error) {
			toast.error('Erro ao enviar formulário. Tente novamente.');
		}
	}

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

					<Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Enviar Solicitação
					</Button>
				</form>
			</Form>
		</div>
	);
}
