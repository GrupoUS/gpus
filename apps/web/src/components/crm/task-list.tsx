import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CheckCircle2, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { trpc } from '../../lib/trpc';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskUser {
	id: number;
	name: string;
}

interface TaskListItem {
	id: number;
	completed?: boolean;
	completedAt?: Date | null;
	createdAt?: Date | number;
	assignedToUser?: TaskUser;
	description: string;
	dueDate?: Date | number | null;
	mentionedUsers?: TaskUser[];
	[key: string]: unknown;
}

interface TaskListProps {
	tasks?: TaskListItem[];
	isLoading: boolean;
}

export function TaskList({ tasks, isLoading }: TaskListProps) {
	const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

	const filteredTasks = tasks?.filter((task) => {
		if (filter === 'pending') return !task.completed;
		if (filter === 'completed') return task.completed;
		return true;
	});

	if (isLoading) {
		return (
			<div className="space-y-2">
				{[1, 2, 3].map((i) => (
					<div className="h-20 animate-pulse rounded-lg bg-muted/20" key={i} />
				))}
			</div>
		);
	}

	if (!tasks || tasks.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
				<CheckCircle2 className="mb-2 h-10 w-10 opacity-20" />
				<p>Nenhuma tarefa encontrada.</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Button
					className="h-7 text-xs"
					onClick={() => setFilter('all')}
					size="sm"
					variant={filter === 'all' ? 'secondary' : 'ghost'}
				>
					Todas ({tasks.length})
				</Button>
				<Button
					className="h-7 text-xs"
					onClick={() => setFilter('pending')}
					size="sm"
					variant={filter === 'pending' ? 'secondary' : 'ghost'}
				>
					Pendentes ({tasks.filter((t) => !t.completed).length})
				</Button>
				<Button
					className="h-7 text-xs"
					onClick={() => setFilter('completed')}
					size="sm"
					variant={filter === 'completed' ? 'secondary' : 'ghost'}
				>
					Concluídas ({tasks.filter((t) => t.completed).length})
				</Button>
			</div>

			<div className="space-y-2">
				{filteredTasks?.length === 0 ? (
					<div className="py-8 text-center text-muted-foreground text-sm">
						Nenhuma tarefa nesta categoria.
					</div>
				) : (
					filteredTasks?.map((task) => <TaskItem key={task.id} task={task} />)
				)}
			</div>
		</div>
	);
}

function TaskItem({ task }: { task: TaskListItem }) {
	// @ts-expect-error - Migration: error TS2339
	const completeTask = trpc.leads.tasks.update.useMutation();
	// @ts-expect-error - Migration: error TS2339
	const deleteTaskMutation = trpc.leads.tasks.delete.useMutation();
	const [isProcessing, setIsProcessing] = useState(false);
	const dueDate = task.dueDate ? new Date(task.dueDate) : undefined;

	const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.completed;
	const isDueToday = dueDate && isToday(dueDate) && !task.completed;

	const handleToggle = async () => {
		if (task.completed) return; // Uncomplete not implemented yet
		try {
			setIsProcessing(true);
			await completeTask({ taskId: task.id });
			toast.success('Tarefa concluída!');
		} catch (_err) {
			toast.error('Erro ao atualizar tarefa');
		} finally {
			setIsProcessing(false);
		}
	};

	const handleDelete = async () => {
		try {
			setIsProcessing(true);
			await deleteTaskMutation.mutateAsync({ taskId: task.id });
			toast.success('Tarefa excluída');
		} catch (_err) {
			toast.error('Erro ao excluir tarefa');
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div
			className={cn(
				'group relative flex items-start gap-3 rounded-lg border bg-card p-3 transition-all hover:shadow-sm',
				isOverdue && 'border-l-4 border-l-red-500 bg-red-50/50',
				isDueToday && 'border-l-4 border-l-yellow-500 bg-yellow-50/50',
				!(isOverdue || isDueToday || task.completed) && 'border-l-4 border-l-green-500',
				task.completed && 'bg-muted/50 opacity-70',
			)}
		>
			<button
				className={cn(
					'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
					task.completed
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-muted-foreground hover:border-primary',
				)}
				disabled={isProcessing || task.completed}
				onClick={handleToggle}
				type="button"
			>
				{task.completed ? (
					<CheckCircle2 className="h-3.5 w-3.5" />
				) : (
					<div className="h-3.5 w-3.5" />
				)}
			</button>

			<div className="flex-1 space-y-1">
				<p
					className={cn(
						'font-medium text-sm leading-none',
						task.completed && 'text-muted-foreground line-through',
					)}
				>
					{task.description}
				</p>

				<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
					{dueDate && (
						<span
							className={cn(
								'flex items-center gap-1',
								isOverdue && 'font-medium text-red-600',
								isDueToday && 'font-medium text-yellow-600',
							)}
						>
							<Calendar className="h-3 w-3" />
							{format(dueDate, "d 'de' MMM", { locale: ptBR })}
						</span>
					)}

					{task.assignedToUser && (
						<span
							className="flex items-center gap-1"
							title={`Atribuído a: ${task.assignedToUser.name}`}
						>
							<User className="h-3 w-3" />
							{task.assignedToUser.name.split(' ')[0]}
						</span>
					)}

					{task.mentionedUsers && task.mentionedUsers.length > 0 && (
						<div className="flex gap-1">
							{task.mentionedUsers.map((u) => (
								<span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]" key={u.id}>
									@{u.name.split(' ')[0]}
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="opacity-0 transition-opacity group-hover:opacity-100">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							className="h-6 w-6 text-muted-foreground hover:text-destructive"
							disabled={isProcessing}
							size="icon"
							variant="ghost"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancelar</AlertDialogCancel>
							<AlertDialogAction disabled={isProcessing} onClick={handleDelete}>
								Excluir
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
