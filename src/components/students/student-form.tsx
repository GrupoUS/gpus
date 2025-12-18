import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

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
});

interface StudentFormProps {
	studentId?: Id<'students'>;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function StudentForm({ studentId, trigger, onSuccess }: StudentFormProps) {
	const [open, setOpen] = useState(false);
	const createStudent = useMutation(api.students.create);
	const updateStudent = useMutation(api.students.update);
	const existingStudent = useQuery(api.students.getById, studentId ? { id: studentId } : 'skip');
	const csUsers = useQuery(api.users.listCSUsers);

	const isEditMode = !!studentId;

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
		},
	});

	// Use useEffect to load data instead of resetting during render to avoid #301 error
	useEffect(() => {
		if (isEditMode && existingStudent && !form.formState.isDirty) {
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
		await createStudent({
			name: values.name,
			email: values.email,
			phone: values.phone,
			cpf: values.cpf || undefined,
			profession: values.profession,
			professionalId: values.professionalId || undefined,
			hasClinic: values.hasClinic,
			clinicName: values.clinicName || undefined,
			clinicCity: values.clinicCity || undefined,
			status: 'ativo',
			assignedCS: values.assignedCS ? (values.assignedCS as Id<'users'>) : undefined,
		});
		toast.success('Aluno criado com sucesso!');
	};

	const handleUpdate = async (values: z.infer<typeof formSchema>, id: Id<'students'>) => {
		await updateStudent({
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
				assignedCS: values.assignedCS ? (values.assignedCS as Id<'users'>) : undefined,
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
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button className="gap-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
						<Plus className="h-4 w-4" />
						{isEditMode ? 'Editar Aluno' : 'Novo Aluno'}
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{isEditMode ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
					<DialogDescription>
						{isEditMode
							? 'Atualize os dados cadastrais deste aluno.'
							: 'Insira os dados para cadastrar um novo aluno no sistema.'}
					</DialogDescription>
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

							{/* Email */}
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input type="email" placeholder="Ex: joao@email.com" {...field} />
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
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione um CS" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="">Nenhum</SelectItem>
												{csUsers?.map((user: { _id: string; name: string }) => (
													<SelectItem key={user._id} value={user._id}>
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

						<div className="flex justify-end pt-4">
							<Button
								type="submit"
								disabled={form.formState.isSubmitting}
								className="w-full sm:w-auto bg-primary hover:bg-primary/90"
							>
								{form.formState.isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{isEditMode ? 'Atualizando...' : 'Criando...'}
									</>
								) : isEditMode ? (
									'Atualizar Aluno'
								) : (
									'Criar Aluno'
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
