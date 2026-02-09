import { Plus } from 'lucide-react';
import { useState } from 'react';

import { TaskForm } from './task-form';
import { TaskList } from './task-list';
import { Button } from '@/components/ui/button';

interface TasksTabProps {
	leadId: number;
}

export function TasksTab({ leadId }: TasksTabProps) {
	// biome-ignore lint/suspicious/noExplicitAny: Required to break deep type inference chain
	const tasksResult = useQuery((api as any).tasks.listTasks, {
		leadId,
		paginationOpts: { numItems: 50, cursor: null },
	});
	const [showForm, setShowForm] = useState(false);

	// Extract tasks from paginated result
	const tasks = tasksResult?.page;

	// Sort tasks client-side for immediate feedback: Overdue -> Today -> Future -> Completed
	const sortedTasks = tasks
		? [...tasks].sort((a, b) => {
				if (a.completed !== b.completed) return a.completed ? 1 : -1;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return a.dueDate - b.dueDate;
			})
		: [];

	return (
		<div className="space-y-4">
			{!showForm && (
				<div className="flex items-center justify-between">
					<h3 className="font-medium text-sm">Tarefas</h3>
					<Button className="h-8 gap-1" onClick={() => setShowForm(true)} size="sm">
						<Plus className="h-3.5 w-3.5" /> Nova Tarefa
					</Button>
				</div>
			)}

			{showForm && (
				<TaskForm
					leadId={leadId}
					onCancel={() => setShowForm(false)}
					onSuccess={() => setShowForm(false)}
				/>
			)}

			<TaskList isLoading={tasks === undefined} tasks={sortedTasks} />
		</div>
	);
}
