import type { Id } from '@convex/_generated/dataModel';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { ObjectionForm } from './objection-form';
import { ObjectionsList } from './objections-list';
import { Button } from '@/components/ui/button';

interface ObjectionsTabProps {
	leadId: Id<'leads'>;
}

export function ObjectionsTab({ leadId }: ObjectionsTabProps) {
	const [showAddRex, setShowAddForm] = useState(false);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg tracking-tight">Objeções</h3>
					<p className="text-muted-foreground text-sm">
						Registre e acompanhe as objeções deste lead.
					</p>
				</div>
				{!showAddRex && (
					<Button className="gap-2" onClick={() => setShowAddForm(true)} size="sm">
						<Plus className="h-4 w-4" />
						Adicionar Objeção
					</Button>
				)}
			</div>

			{showAddRex && (
				<div className="slide-in-from-top-2 animate-in duration-200">
					<ObjectionForm
						leadId={leadId}
						onCancel={() => setShowAddForm(false)}
						onSuccess={() => setShowAddForm(false)}
					/>
				</div>
			)}

			<ObjectionsList leadId={leadId} />
		</div>
	);
}
