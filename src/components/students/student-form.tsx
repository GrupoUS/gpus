import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { trpc } from '../../lib/trpc';
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

// Schema definition matching Convex schema
const formSchema = z.object({
	name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
	email: z.string().email({ message: 'Email inválido' }),
	phone: z.string().min(10, { message: 'Telefone inválido' }),
	cpf: z.string().optional(),
	profession: z.string().min(1, { message: 'Profissão é obrigatória' }),
	professionalId: z.string().optional(),
	hasClinic: z.boolean(),
	clinicName: z.string().optional(),
	clinicCity: z.string().optional(),
	assignedCS: z.string().optional(),
	lgpdConsent: z.boolean().refine((val) => val === true, {
		message: 'Você deve aceitar os termos da LGPD',
	}),
});

interface StudentFormProps {
	studentId?: number;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function StudentForm({ studentId, trigger, onSuccess }: StudentFormProps) {
	const [open, setOpen] = useState(false);
	const createStudent = trpc.students.create.useMutation();
	const updateStudent = trpc.students.update.useMutation();
	const { data: existingStudent } = trpc.students.get.useQuery(
		// @ts-expect-error - Migration: error TS2769
		{ id: studentId },
		{ enabled: !!studentId },
	);
	const { data: csUsers } = trpc.users.listSystemUsers.useQuery();

	const isEditMode = !!studentId;
	const dialogTitle = isEditMode ? 'Editar Aluno' : 'Novo Aluno';
	const dialogDescription = isEditMode
		? 'Atualize os dados cadastrais deste aluno.'
		: 'Insira os dados para cadastrar um novo aluno no sistema.';

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			cpf: '',
			profession: '',
			professionalId: '',
			hasClinic: false,
			clinicName: '',
			clinicCity: '',
			assignedCS: '',
			lgpdConsent: false,
		},
	});

	// Use useEffect to load data instead of resetting during render to avoid #301 error
	useEffect(() => {
		if (isEditMode && existingStudent && !form.formState.isDirty) {
			// @ts-expect-error - Migration: error TS2345
			form.reset({
				name: existingStudent.name,
				email: existingStudent.email,
				phone: existingStudent.phone,
				cpf: existingStudent.cpf || '',
				profession: existingStudent.profession,
				professionalId: existingStudent.professionalId || '',
				hasClinic: existingStudent.hasClinic,
				clinicName: existingStudent.clinicName || '',
				clinicCity: existingStudent.clinicCity || '',
				assignedCS: existingStudent.assignedCS || '',
			});
		}
	}, [isEditMode, existingStudent, form]);

	const handleCreate = async (values: z.infer<typeof formSchema>) => {
		await createStudent.mutateAsync(
				{
			name: values.name,
			email: values.email,
			phone: values.phone,
			cpf: values.cpf || undefined,
			profession: values.profession,
			professionalId: values.professionalId || undefined,
			hasClinic: values.hasClinic,
			clinicName: values.clinicName || undefined,
			clinicCity: values.clinicCity || undefined,
			// @ts-expect-error - Migration: error TS2353
			status: 'ativo',
			// @ts-expect-error - Migration: error TS2352
			assignedCS: values.assignedCS ? (values.assignedCS as number) : undefined,
			lgpdConsent: values.lgpdConsent,
		});
		toast.success('Aluno criado com sucesso!');
	};

	const handleUpdate = async (values: z.infer<typeof formSchema>, id: number) => {
		await updateStudent.mutateAsync(
				{
			studentId: id,
			patch: {
				name: values.name,
				email: values.email,
				phone: values.phone,
				profession: values.profession,
				professionalId: values.professionalId || undefined,
				hasClinic: values.hasClinic,
				clinicName: values.clinicName || undefined,
				clinicCity: values.clinicCity || undefined,
				cpf: values.cpf || undefined,
				// @ts-expect-error - Migration: error TS2353
				assignedCS: values.assignedCS ? (values.assignedCS as number) : undefined,
			},
		});
		toast.success('Aluno atualizado com sucesso!');
	};

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			if (isEditMode && studentId) {
				await handleUpdate(values, studentId);
			} else {
				await handleCreate(values);
			}
			setOpen(false);
			form.reset();
			onSuccess?.();
		} catch {
			toast.error(isEditMode ? 'Erro ao atualizar aluno.' : 'Erro ao criar aluno.');
		}
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				{trigger || (
					<Button className="gap-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
						<Plus className="h-4 w-4" />
						{dialogTitle}
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{dialogTitle}</DialogTitle>
					<DialogDescription>{dialogDescription}</DialogDescription>
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

							{/* Email */}
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input placeholder="Ex: joao@email.com" type="email" {...field} />
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
										<FormLabel>Telefone</FormLabel>
										<FormControl>
											<Input placeholder="Ex: 11999999999" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* CPF */}
							<FormField
								control={form.control}
								name="cpf"
								render={({ field }) => (
									<FormItem>
										<FormLabel>CPF (Opcional)</FormLabel>
										<FormControl>
											<Input placeholder="Ex: 123.456.789-00" {...field} />
										</FormControl>
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
										<FormControl>
											<Input placeholder="Ex: Enfermeiro" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* ID Profissional */}
							<FormField
								control={form.control}
								name="professionalId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>ID Profissional (Opcional)</FormLabel>
										<FormControl>
											<Input placeholder="Ex: COREN, CRO" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* CS Atribuído */}
							<FormField
								control={form.control}
								name="assignedCS"
								render={({ field }) => (
									<FormItem>
										<FormLabel>CS Atribuído (Opcional)</FormLabel>
										<Select
											onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
											value={field.value || 'none'}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione um CS" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">Nenhum</SelectItem>
												{csUsers?.map((user: { id: any; name: string }) => (
													<SelectItem key={user.id} value={user.id}>
														{user.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Tem Clínica */}
						<FormField
							control={form.control}
							name="hasClinic"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Tem clínica</FormLabel>
									</div>
								</FormItem>
							)}
						/>

						{/* Nome da Clínica */}
						{form.watch('hasClinic') && (
							<FormField
								control={form.control}
								name="clinicName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome da Clínica</FormLabel>
										<FormControl>
											<Input placeholder="Ex: Clínica Estética" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* Cidade da Clínica */}
						{form.watch('hasClinic') && (
							<FormField
								control={form.control}
								name="clinicCity"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Cidade da Clínica</FormLabel>
										<FormControl>
											<Input placeholder="Ex: São Paulo" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* LGPD Consent */}
						{!isEditMode && (
							<FormField
								control={form.control}
								name="lgpdConsent"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border bg-muted/50 p-4">
										<FormControl>
											<Checkbox checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>
												Estou de acordo com o processamento dos meus dados pessoais para fins
												acadêmicos e de gestão, conforme a Lei Geral de Proteção de Dados (LGPD).
											</FormLabel>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
						)}

						<div className="flex justify-end pt-4">
							<Button
								className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
								disabled={form.formState.isSubmitting}
								type="submit"
							>
								{(() => {
									if (form.formState.isSubmitting) {
										return (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												{isEditMode ? 'Atualizando...' : 'Criando...'}
											</>
										);
									}
									return isEditMode ? 'Atualizar Aluno' : 'Criar Aluno';
								})()}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
