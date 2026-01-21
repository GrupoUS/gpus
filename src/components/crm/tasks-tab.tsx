import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';

import { TaskForm } from './task-form';
import { TaskList } from './task-list';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TasksTabProps {
	leadId: Id<'leads'>;
}

export function TasksTab({ leadId }: TasksTabProps) {
	// biome-ignore lint/suspicious/noExplicitAny: Required to break deep type inference chain
	const tasks = useQuery((api as any).tasks.listTasks, { leadId });
	const [showForm, setShowForm] = useState(false);
	const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

	// biome-ignore lint/suspicious/noExplicitAny: Dynamic task type
	const pendingCount = tasks?.filter((t: any) => !t.completed).length ?? 0;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-lg">Tarefas</h3>
				<Button
					onClick={() => setShowForm(!showForm)}
					size="sm"
					variant={showForm ? 'secondary' : 'default'}
				>
					<PlusCircle className="mr-2 h-4 w-4" />
					Nova Tarefa
				</Button>
			</div>

			{showForm && (
				<TaskForm
					leadId={leadId}
					onCancel={() => setShowForm(false)}
					onSuccess={() => setShowForm(false)}
				/>
			)}

			<Tabs
				className="w-full"
				defaultValue="all"
				onValueChange={(val) => setFilter(val as 'all' | 'pending' | 'completed')}
			>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="all">Todas</TabsTrigger>
					<TabsTrigger value="pending">
						Pendentes
						{pendingCount > 0 && (
							<span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
								{pendingCount}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="completed">Concluídas</TabsTrigger>
				</TabsList>

				{/* Pass filter prop to TaskList instead of TabsContent to keep list unified/animatable potentially, 
            but for now TabsContent wrapper is standard shadcn, except we want the list to handle filtering logic or parent.
            Wait, I implemented filtering inside TaskList based on prop. So I don't need TabsContent content variation,
            just the TabsList to control state.
        */}
				<div className="mt-4">
					{tasks === undefined ? (
						<div className="py-10 text-center">
							<div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						</div>
					) : (
						<TaskList filter={filter} tasks={tasks} />
					)}
				</div>
			</Tabs>
		</div>
	);
}
