import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { trpc } from '../../lib/trpc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Lead } from '@/types/api';

const editLeadSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	phone: z.string().min(10, 'Telefone inválido'),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	profession: z.string().optional(),
	interestedProduct: z.string().optional(),
	temperature: z.enum(['frio', 'morno', 'quente']).optional(),
	mainPain: z.string().optional(),
	mainDesire: z.string().optional(),
	hasClinic: z.boolean().optional(),
	clinicName: z.string().optional(),
	clinicCity: z.string().optional(),
	yearsInAesthetics: z.coerce.number().optional(),
	currentRevenue: z.string().optional(),
});

type EditLeadFormData = z.infer<typeof editLeadSchema>;

interface LeadEditDialogProps {
	lead: Lead;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LeadEditDialog({ lead, open, onOpenChange }: LeadEditDialogProps) {
	const updateLead = trpc.leads.updateLead.useMutation();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for react-hook-form zod resolver deep type fix
	const form = useForm({
		resolver: zodResolver(editLeadSchema),
		defaultValues: {
			name: lead.name || '',
			phone: lead.phone || '',
			email: lead.email || '',
			profession: lead.profession || '',
			interestedProduct: lead.interestedProduct || '',
			temperature: lead.temperature || 'frio',
			mainPain: lead.mainPain || '',
			mainDesire: lead.mainDesire || '',
			hasClinic: lead.hasClinic,
			clinicName: lead.clinicName || '',
			clinicCity: lead.clinicCity || '',
			yearsInAesthetics: lead.yearsInAesthetics || undefined,
			currentRevenue: lead.currentRevenue || '',
		},
	}) as UseFormReturn<EditLeadFormData>;

	const onSubmit = async (data: EditLeadFormData) => {
		try {
			await updateLead({
				leadId: lead.id,
				patch: {
					name: data.name,
					phone: data.phone,
					email: data.email || undefined,
					profession: data.profession || undefined,
					interestedProduct: data.interestedProduct || undefined,
					temperature: data.temperature,
					mainPain: data.mainPain || undefined,
					mainDesire: data.mainDesire || undefined,
					hasClinic: data.hasClinic,
					clinicName: data.clinicName || undefined,
					clinicCity: data.clinicCity || undefined,
					yearsInAesthetics: data.yearsInAesthetics,
					currentRevenue: data.currentRevenue || undefined,
				},
			});
			toast.success('Lead atualizado com sucesso');
			onOpenChange(false);
		} catch (error) {
			toast.error(
				`Erro ao atualizar lead: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
			);
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Editar Lead</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
						{/* Basic Info */}
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome</FormLabel>
										<FormControl>
											<Input placeholder="Nome completo" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Telefone</FormLabel>
										<FormControl>
											<Input placeholder="11999999999" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="email@exemplo.com" type="email" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Interest Info */}
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="interestedProduct"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Produto de Interesse</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="otb">OTB 2025</SelectItem>
												<SelectItem value="black_neon">NEON</SelectItem>
												<SelectItem value="trintae3">TRINTAE3</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="temperature"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Temperatura</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="frio">❄️ Frio</SelectItem>
												<SelectItem value="morno">🌤️ Morno</SelectItem>
												<SelectItem value="quente">🔥 Quente</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Pain Points */}
						<FormField
							control={form.control}
							name="mainPain"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Dor Principal</FormLabel>
									<FormControl>
										<Textarea
											className="resize-none"
											placeholder="Qual a principal dor do lead?"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="mainDesire"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Desejo / Objetivo</FormLabel>
									<FormControl>
										<Textarea
											className="resize-none"
											placeholder="Qual o principal objetivo do lead?"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Professional Info */}
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="profession"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Profissão</FormLabel>
										<FormControl>
											<Input placeholder="Ex: Dentista" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="yearsInAesthetics"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Anos em Estética</FormLabel>
										<FormControl>
											<Input placeholder="0" type="number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="clinicName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome da Clínica</FormLabel>
										<FormControl>
											<Input placeholder="Nome da clínica" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="clinicCity"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Cidade da Clínica</FormLabel>
										<FormControl>
											<Input placeholder="Cidade" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="currentRevenue"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Faturamento Atual</FormLabel>
									<FormControl>
										<Input placeholder="Ex: R$ 10.000 - R$ 20.000" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Actions */}
						<div className="flex justify-end gap-2 pt-4">
							<Button onClick={() => onOpenChange(false)} type="button" variant="outline">
								Cancelar
							</Button>
							<Button disabled={form.formState.isSubmitting} type="submit">
								{form.formState.isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Salvando...
									</>
								) : (
									'Salvar'
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
