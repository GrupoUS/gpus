import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const taskSchema = z.object({
	description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
	dueDate: z.date().optional(),
	mentionedUserIds: z.array(z.string()).optional(),
});

interface TaskFormProps {
	leadId: Id<'leads'>;
	onCancel: () => void;
	onSuccess: () => void;
}

export function TaskForm({ leadId, onCancel, onSuccess }: TaskFormProps) {
	const createTask = useMutation(api.tasks.createTask);
	const users = useQuery(api.users.list) || [];
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [openUserSelect, setOpenUserSelect] = useState(false);

	const form = useForm<z.infer<typeof taskSchema>>({
		resolver: zodResolver(taskSchema),
		defaultValues: {
			description: '',
			mentionedUserIds: [],
		},
	});

	const mentionedUserIds = form.watch('mentionedUserIds') || [];

	const onSubmit = async (values: z.infer<typeof taskSchema>) => {
		try {
			setIsSubmitting(true);
			await createTask({
				leadId,
				description: values.description,
				dueDate: values.dueDate ? values.dueDate.getTime() : undefined,
				mentionedUserIds: values.mentionedUserIds as Id<'users'>[],
			});
			toast.success('Tarefa criada com sucesso!');
			form.reset();
			onSuccess();
		} catch (error) {
			console.error('Erro ao criar tarefa:', error);
			toast.error('Erro ao criar tarefa. Tente novamente.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const toggleUser = (userId: string) => {
		const current = form.getValues('mentionedUserIds') || [];
		if (current.includes(userId)) {
			form.setValue(
				'mentionedUserIds',
				current.filter((id) => id !== userId),
			);
		} else {
			form.setValue('mentionedUserIds', [...current, userId]);
		}
	};

	return (
		<div className="slide-in-from-top-2 animate-in rounded-lg border bg-muted/30 p-4">
			<Form {...form}>
				<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										className="bg-background"
										placeholder="O que precisa ser feito? (Ex: Ligar para apresentar proposta)"
										{...field}
										autoFocus
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex flex-wrap items-center gap-2">
						<FormField
							control={form.control}
							name="dueDate"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													className={cn(
														'h-9 w-[180px] bg-background pl-3 text-left font-normal',
														!field.value && 'text-muted-foreground',
													)}
													size="sm"
													variant="outline"
												>
													{field.value ? (
														format(field.value, "d 'de' MMMM", { locale: ptBR })
													) : (
														<span>Data de vencimento</span>
													)}
													<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent align="start" className="w-auto p-0">
											<Calendar
												disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
												initialFocus
												mode="single"
												onSelect={field.onChange}
												selected={field.value}
											/>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Popover onOpenChange={setOpenUserSelect} open={openUserSelect}>
							<PopoverTrigger asChild>
								<Button className="h-9 bg-background" size="sm" variant="outline">
									@ Mencionar
									{mentionedUserIds.length > 0 && (
										<span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
											{mentionedUserIds.length}
										</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent align="start" className="p-0">
								<Command>
									<CommandInput placeholder="Buscar usuário..." />
									<CommandList>
										<CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
										<CommandGroup>
											{users.map((user) => (
												<CommandItem
													key={user._id}
													onSelect={() => toggleUser(user._id)}
													value={user.name}
												>
													<div
														className={cn(
															'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
															mentionedUserIds.includes(user._id)
																? 'bg-primary text-primary-foreground'
																: 'opacity-50 [&_svg]:invisible',
														)}
													>
														<svg
															aria-hidden="true"
															className={cn('h-4 w-4')}
															fill="none"
															stroke="currentColor"
															strokeWidth={2}
															viewBox="0 0 24 24"
														>
															<path
																d="M5 13l4 4L19 7"
																strokeLinecap="round"
																strokeLinejoin="round"
															/>
														</svg>
													</div>
													{user.name}
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>

					{mentionedUserIds.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{mentionedUserIds.map((userId) => {
								const user = users.find((u) => u._id === userId);
								return user ? (
									<div
										className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary text-xs"
										key={userId}
									>
										@{user.name}
										<button
											className="ml-1 rounded-full hover:bg-primary/20"
											onClick={() => toggleUser(userId)}
											type="button"
										>
											<X className="h-3 w-3" />
										</button>
									</div>
								) : null;
							})}
						</div>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							disabled={isSubmitting}
							onClick={onCancel}
							size="sm"
							type="button"
							variant="ghost"
						>
							Cancelar
						</Button>
						<Button disabled={isSubmitting} size="sm" type="submit">
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
								</>
							) : (
								'Criar Tarefa'
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
