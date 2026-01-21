import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
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
	description: z.string().min(1, 'Descrição é obrigatória'),
	dueDate: z.date().optional(),
	mentionedUserIds: z.array(z.string()).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface UserOption {
	_id: Id<'users'>;
	name?: string;
	email?: string;
}

interface TaskFormProps {
	leadId: Id<'leads'>;
	onCancel: () => void;
	onSuccess?: () => void;
}

export function TaskForm({ leadId, onCancel, onSuccess }: TaskFormProps) {
	const [openMentions, setOpenMentions] = useState(false);
	const createTask = useMutation(api.tasks.createTask);
	const useQueryUnsafe = useQuery as unknown as (query: unknown, args?: unknown) => unknown;
	const apiAny = api as unknown as { users: { list: unknown } };
	const users = useQueryUnsafe(apiAny.users.list) as UserOption[] | undefined;

	const form = useForm<TaskFormValues>({
		resolver: zodResolver(taskSchema),
		defaultValues: {
			description: '',
			mentionedUserIds: [],
		},
	});

	const onSubmit = async (data: TaskFormValues) => {
		try {
			await createTask({
				leadId,
				description: data.description,
				dueDate: data.dueDate ? data.dueDate.getTime() : undefined,
				mentionedUserIds: data.mentionedUserIds as Id<'users'>[],
			});
			toast.success('Tarefa criada com sucesso!');
			form.reset();
			onSuccess?.();
			onSuccess?.();
		} catch (_error) {
			toast.error('Erro ao criar tarefa.');
		}
	};

	const toggleMention = (userId: string) => {
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
		<div className="rounded-lg border bg-muted/30 p-4">
			<Form {...form}>
				<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input placeholder="Ex: Ligar para apresentar proposta" {...field} />
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
														'w-[240px] pl-3 text-left font-normal',
														!field.value && 'text-muted-foreground',
													)}
													variant={'outline'}
												>
													{field.value ? (
														format(field.value, 'PPP', { locale: ptBR })
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

						<Popover onOpenChange={setOpenMentions} open={openMentions}>
							<PopoverTrigger asChild>
								<Button className="justify-between" role="combobox" variant="outline">
									{form.watch('mentionedUserIds')?.length
										? `${form.watch('mentionedUserIds')?.length} mencionado(s)`
										: 'Mencionar equipe'}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[200px] p-0">
								<Command>
									<CommandInput placeholder="Buscar usuário..." />
									<CommandList>
										<CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
										<CommandGroup>
											{users?.map((user) => {
												const userName = user.name || user.email || 'Usuário';
												return (
													<CommandItem
														key={user._id}
														onSelect={() => toggleMention(user._id)}
														value={userName}
													>
														<div
															className={cn(
																'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
																form.watch('mentionedUserIds')?.includes(user._id)
																	? 'bg-primary text-primary-foreground'
																	: 'opacity-50 [&_svg]:invisible',
															)}
														>
															<svg
																className={cn('h-4 w-4')}
																fill="none"
																height="24"
																stroke="currentColor"
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth="2"
																viewBox="0 0 24 24"
																width="24"
																xmlns="http://www.w3.org/2000/svg"
															>
																<title>Check</title>
																<polyline points="20 6 9 17 4 12" />
															</svg>
														</div>
														{userName}
													</CommandItem>
												);
											})}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>

					{/* Selected Mentions Badges */}
					{form.watch('mentionedUserIds') &&
						form.watch('mentionedUserIds')?.length !== undefined &&
						(form.watch('mentionedUserIds')?.length ?? 0) > 0 && (
							<div className="flex gap-2">
								{form.watch('mentionedUserIds')?.map((userId) => {
									const user = users?.find((u: { _id: string }) => u._id === userId);
									return user ? (
										<Badge key={userId} variant="secondary">
											@{user.name}
										</Badge>
									) : null;
								})}
							</div>
						)}

					<div className="flex justify-end gap-2">
						<Button onClick={onCancel} size="sm" type="button" variant="ghost">
							Cancelar
						</Button>
						<Button disabled={form.formState.isSubmitting} size="sm" type="submit">
							{form.formState.isSubmitting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Criar Tarefa
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
