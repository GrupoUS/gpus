import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { CustomFieldsSection } from './custom-fields-section';
import { ReferralAutocomplete } from './referral-autocomplete';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { FlipButton, FlipButtonBack, FlipButtonFront } from '@/components/ui/flip-button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Schema definition matching Convex schema
const leadFormSchema = z
	.object({
		name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
		phone: z.string().min(10, { message: 'Telefone inválido' }),
		email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
		source: z.enum([
			'whatsapp',
			'instagram',
			'landing_page',
			'indicacao',
			'evento',
			'organico',
			'trafego_pago',
			'outro',
		]),
		profession: z
			.enum([
				'enfermeiro',
				'dentista',
				'biomedico',
				'farmaceutico',
				'medico',
				'esteticista',
				'outro',
			])
			.optional(),
		interestedProduct: z
			.enum([
				'trintae3',
				'otb',
				'black_neon',
				'comunidade',
				'auriculo',
				'na_mesa_certa',
				'indefinido',
			])
			.optional(),
		temperature: z.enum(['frio', 'morno', 'quente']),
		stage: z.enum([
			'novo',
			'primeiro_contato',
			'qualificado',
			'proposta',
			'negociacao',
			'fechado_ganho',
			'fechado_perdido',
		]),
		// Clinic qualification
		hasClinic: z.boolean().optional(),
		clinicName: z.string().optional(),
		clinicCity: z.string().optional(),
		// Professional background
		yearsInAesthetics: z.string().optional(),
		currentRevenue: z.enum(['0-5k', '5k-10k', '10k-20k', '20k-50k', '50k+']).optional(),
		// Diagnosis
		mainPain: z
			.enum(['tecnica', 'vendas', 'gestao', 'posicionamento', 'escala', 'certificacao', 'outro'])
			.optional(),
		mainDesire: z.string().max(500).optional(),
		// Referrals
		referredById: z.string().optional(),
		// Assignment
		assignedTo: z.string().optional(),
		// Custom Fields
		customFields: z.record(z.string(), z.any()).optional(),
	})
	.refine(
		(data) => {
			if (data.hasClinic && !data.clinicName) return false;
			return true;
		},
		{ message: 'Nome da clínica é obrigatório', path: ['clinicName'] },
	);

export function LeadForm() {
	const [open, setOpen] = useState(false);
	const useMutationUnsafe = useMutation as unknown as (
		mutation: unknown,
	) => (args: unknown) => Promise<unknown>;
	const apiAny = api as unknown as Record<string, Record<string, unknown>>;
	const createLead = useMutationUnsafe(apiAny.leads.createLead);
	const vendors = useQuery(api.users.listVendors);

	const form = useForm<z.infer<typeof leadFormSchema>>({
		resolver: zodResolver(leadFormSchema),
		defaultValues: {
			name: '',
			phone: '',
			email: '',
			source: 'instagram',
			profession: undefined,
			interestedProduct: undefined,
			temperature: 'frio',
			stage: 'novo',
			hasClinic: false,
			clinicName: '',
			clinicCity: '',
			yearsInAesthetics: '',
			currentRevenue: undefined,
			mainPain: undefined,
			mainDesire: '',
			referredById: '',
		},
	});

	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Form submission logic is naturally complex
	const onSubmit = async (values: z.infer<typeof leadFormSchema>) => {
		try {
			// Clean up optional empty strings to undefined for Convex compatibility
			const payload = {
				name: values.name,
				phone: values.phone,
				source: values.source,
				temperature: values.temperature,
				stage: values.stage,
				// Optional fields - only include if they have values
				...(values.email && { email: values.email }),
				...(values.profession && { profession: values.profession }),
				...(values.interestedProduct && { interestedProduct: values.interestedProduct }),
				...(values.hasClinic !== undefined && { hasClinic: values.hasClinic }),
				...(values.clinicName && { clinicName: values.clinicName }),
				...(values.clinicCity && { clinicCity: values.clinicCity }),
				...(values.yearsInAesthetics &&
					!Number.isNaN(Number(values.yearsInAesthetics)) && {
						yearsInAesthetics: Number(values.yearsInAesthetics),
					}),
				...(values.currentRevenue && { currentRevenue: values.currentRevenue }),
				...(values.mainPain && { mainPain: values.mainPain }),
				...(values.mainDesire && { mainDesire: values.mainDesire }),
				...(values.referredById && { referredById: values.referredById }),
				...(values.assignedTo && { assignedTo: values.assignedTo as Id<'users'> }),

				// Custom Fields Mapping
				customFieldValues: values.customFields
					? Object.entries(values.customFields).map(([key, value]) => ({
							customFieldId: key as Id<'customFields'>,
							value,
						}))
					: undefined,

				lgpdConsent: true, // Manual entry implies consent or legitimate interest
				whatsappConsent: true,
			};

			await createLead(payload);
			toast.success('Lead criado com sucesso!');
			setOpen(false);
			form.reset();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Erro desconhecido';
			if (message.includes('Unauthenticated')) {
				toast.error('Sessão expirada. Por favor, faça login novamente.');
			} else {
				toast.error(`Erro ao criar lead: ${message}`);
			}
		}
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<div className="mb-4 w-full px-1">
				<DialogTrigger asChild>
					<FlipButton className="h-12 w-full" initial={false}>
						<FlipButtonFront className="h-full w-full overflow-hidden rounded-full bg-transparent p-0">
							<HoverBorderGradient
								as="div"
								className="flex h-full w-full items-center justify-center bg-background font-medium text-foreground"
								containerClassName="rounded-full w-full h-full"
							>
								<Plus className="mr-2 h-4 w-4" />
								Novo Lead
							</HoverBorderGradient>
						</FlipButtonFront>
						<FlipButtonBack className="h-full w-full overflow-hidden rounded-full bg-transparent p-0">
							<HoverBorderGradient
								as="div"
								className="flex h-full w-full items-center justify-center bg-[#004b5a] font-bold text-[#d4af37] tracking-wide"
								clockwise={false}
								containerClassName="rounded-full w-full h-full border-none"
							>
								Cadastrar
							</HoverBorderGradient>
						</FlipButtonBack>
					</FlipButton>
				</DialogTrigger>
			</div>
			<DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Novo Lead</DialogTitle>
					<DialogDescription>
						Preencha os dados para criar um novo lead no sistema.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{/* Nome */}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome Completo</FormLabel>
										<FormControl>
											<Input placeholder="Ex: João Silva" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Telefone */}
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Telefone (WhatsApp)</FormLabel>
										<FormControl>
											<Input placeholder="Ex: 11999999999" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Email */}
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email (Opcional)</FormLabel>
										<FormControl>
											<Input placeholder="Ex: joao@email.com" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Indicação */}
							<FormField
								control={form.control}
								name="referredById"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>Indicado por (Opcional)</FormLabel>
										<FormControl>
											<ReferralAutocomplete onChange={field.onChange} value={field.value} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Responsável */}
							<FormField
								control={form.control}
								name="assignedTo"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Responsável (Opcional)</FormLabel>
										<Select onValueChange={field.onChange} value={field.value || ''}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione o responsável" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{vendors?.map((vendor) => (
													<SelectItem key={vendor.id} value={vendor.id}>
														{vendor.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Fonte */}
							<FormField
								control={form.control}
								name="source"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Fonte de Aquisição</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione a fonte" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="whatsapp">WhatsApp</SelectItem>
												<SelectItem value="instagram">Instagram</SelectItem>
												<SelectItem value="landing_page">Landing Page</SelectItem>
												<SelectItem value="trafego_pago">Tráfego Pago</SelectItem>
												<SelectItem value="indicacao">Indicação</SelectItem>
												<SelectItem value="evento">Evento</SelectItem>
												<SelectItem value="organico">Orgânico</SelectItem>
												<SelectItem value="outro">Outro</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Profissão */}
							<FormField
								control={form.control}
								name="profession"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Profissão</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="enfermeiro">Enfermeiro(a)</SelectItem>
												<SelectItem value="dentista">Dentista</SelectItem>
												<SelectItem value="biomedico">Biomédico(a)</SelectItem>
												<SelectItem value="farmaceutico">Farmacêutico(a)</SelectItem>
												<SelectItem value="medico">Médico(a)</SelectItem>
												<SelectItem value="esteticista">Esteticista</SelectItem>
												<SelectItem value="outro">Outro</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Produto */}
							<FormField
								control={form.control}
								name="interestedProduct"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Produto de Interesse</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="trintae3">TrintaE3 (33)</SelectItem>
												<SelectItem value="otb">OTB</SelectItem>
												<SelectItem value="black_neon">Black Neon</SelectItem>
												<SelectItem value="comunidade">Comunidade</SelectItem>
												<SelectItem value="auriculo">Aurículo</SelectItem>
												<SelectItem value="na_mesa_certa">Na Mesa Certa</SelectItem>
												<SelectItem value="indefinido">Ainda não sabe</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Clínica */}
						<div className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-4">
							<FormField
								control={form.control}
								name="hasClinic"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0">
										<FormControl>
											<Checkbox checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Possui clínica ou consultório próprio?</FormLabel>
										</div>
									</FormItem>
								)}
							/>

							{form.watch('hasClinic') && (
								<div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
									<FormField
										control={form.control}
										name="clinicName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nome da Clínica</FormLabel>
												<FormControl>
													<Input placeholder="Ex: Clínica Estética Bella" {...field} />
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
												<FormLabel>Cidade</FormLabel>
												<FormControl>
													<Input placeholder="Ex: São Paulo" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}
						</div>

						{/* Background Profissional */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="yearsInAesthetics"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Anos na Estética</FormLabel>
										<FormControl>
											<Input placeholder="Ex: 3" type="number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="currentRevenue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Faturamento Mensal</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="0-5k">Até R$ 5.000</SelectItem>
												<SelectItem value="5k-10k">R$ 5.000 - R$ 10.000</SelectItem>
												<SelectItem value="10k-20k">R$ 10.000 - R$ 20.000</SelectItem>
												<SelectItem value="20k-50k">R$ 20.000 - R$ 50.000</SelectItem>
												<SelectItem value="50k+">Acima de R$ 50.000</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Diagnóstico */}
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="mainPain"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Dor Principal</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Qual a maior dificuldade?" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="tecnica">Técnica / Conhecimento</SelectItem>
												<SelectItem value="vendas">Vendas / Captação</SelectItem>
												<SelectItem value="gestao">Gestão / Processos</SelectItem>
												<SelectItem value="posicionamento">Posicionamento / Marketing</SelectItem>
												<SelectItem value="escala">Escala / Crescimento</SelectItem>
												<SelectItem value="certificacao">Certificação / Regularização</SelectItem>
												<SelectItem value="outro">Outro</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="mainDesire"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Principal Desejo / Objetivo</FormLabel>
										<FormControl>
											<Textarea
												className="resize-none"
												placeholder="Ex: Quero faturar R$ 30k/mês com procedimentos estéticos..."
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Temperatura */}
						<FormField
							control={form.control}
							name="temperature"
							render={({ field }) => (
								<FormItem className="space-y-3">
									<FormLabel>Temperatura Inicial</FormLabel>
									<FormControl>
										<RadioGroup
											className="flex space-x-4"
											defaultValue={field.value}
											onValueChange={field.onChange}
										>
											<FormItem className="flex items-center space-x-2 space-y-0">
												<FormControl>
													<RadioGroupItem value="frio" />
												</FormControl>
												<FormLabel className="cursor-pointer font-normal text-primary">
													❄️ Frio
												</FormLabel>
											</FormItem>
											<FormItem className="flex items-center space-x-2 space-y-0">
												<FormControl>
													<RadioGroupItem value="morno" />
												</FormControl>
												<FormLabel className="cursor-pointer font-normal text-yellow-400">
													🌤️ Morno
												</FormLabel>
											</FormItem>
											<FormItem className="flex items-center space-x-2 space-y-0">
												<FormControl>
													<RadioGroupItem value="quente" />
												</FormControl>
												<FormLabel className="cursor-pointer font-normal text-red-500">
													🔥 Quente
												</FormLabel>
											</FormItem>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Custom Fields Section */}
						<div className="rounded-lg border border-border/50 bg-muted/30 p-4">
							<CustomFieldsSection control={form.control} entityType="lead" />
						</div>

						<div className="flex justify-end pt-4">
							<Button
								className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
								disabled={form.formState.isSubmitting}
								type="submit"
							>
								{form.formState.isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Criando...
									</>
								) : (
									'Criar Lead'
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
