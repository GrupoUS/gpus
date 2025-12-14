import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

// Schema definition matching Convex schema
const formSchema = z.object({
	name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
	phone: z.string().min(10, { message: 'Telefone inválido' }), // Simple check, could be improved with regex
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
		.enum(['enfermeiro', 'dentista', 'biomedico', 'farmaceutico', 'medico', 'esteticista', 'outro'])
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
	// Stage is implicitly 'novo' for creation, but could be selectable if needed
	stage: z
		.enum([
			'novo',
			'primeiro_contato',
			'qualificado',
			'proposta',
			'negociacao',
			'fechado_ganho',
			'fechado_perdido',
		])
		.default('novo'),
});

export function LeadForm() {
	const [open, setOpen] = useState(false);
	const createLead = useMutation(api.leads.createLead);

	const form = useForm<z.infer<typeof formSchema>>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			name: '',
			phone: '',
			email: '',
			source: 'instagram', // Default
			profession: undefined,
			interestedProduct: undefined,
			temperature: 'frio',
			stage: 'novo',
		},
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			// Clean up optional empty strings to undefined if needed, or Zod handles it
			// For email, if empty string, passing undefined might be cleaner if backend expects optional string
			const payload = {
				...values,
				email: values.email || undefined,
			};

			await createLead(payload);
			toast.success('Lead criado com sucesso!');
			setOpen(false);
			form.reset();
		} catch {
			toast.error('Erro ao criar lead.');
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20">
					<Plus className="h-4 w-4" />
					Novo Lead
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-border/50">
				<DialogHeader>
					<DialogTitle>Novo Lead</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

							{/* Fonte */}
							<FormField
								control={form.control}
								name="source"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Fonte de Aquisição</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
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
										<Select onValueChange={field.onChange} defaultValue={field.value}>
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
										<Select onValueChange={field.onChange} defaultValue={field.value}>
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

						{/* Temperatura */}
						<FormField
							control={form.control}
							name="temperature"
							render={({ field }) => (
								<FormItem className="space-y-3">
									<FormLabel>Temperatura Inicial</FormLabel>
									<FormControl>
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="flex space-x-4"
										>
											<FormItem className="flex items-center space-x-2 space-y-0">
												<FormControl>
													<RadioGroupItem value="frio" />
												</FormControl>
												<FormLabel className="font-normal cursor-pointer text-blue-400">
													❄️ Frio
												</FormLabel>
											</FormItem>
											<FormItem className="flex items-center space-x-2 space-y-0">
												<FormControl>
													<RadioGroupItem value="morno" />
												</FormControl>
												<FormLabel className="font-normal cursor-pointer text-yellow-400">
													🌤️ Morno
												</FormLabel>
											</FormItem>
											<FormItem className="flex items-center space-x-2 space-y-0">
												<FormControl>
													<RadioGroupItem value="quente" />
												</FormControl>
												<FormLabel className="font-normal cursor-pointer text-red-500">
													🔥 Quente
												</FormLabel>
											</FormItem>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end pt-4">
							<Button
								type="submit"
								disabled={form.formState.isSubmitting}
								className="w-full sm:w-auto bg-primary hover:bg-primary/90"
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
