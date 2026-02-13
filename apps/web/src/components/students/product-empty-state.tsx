'use client';

import { GraduationCap, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ProductEmptyStateProps {
	message?: string;
	onAddStudent?: () => void;
}

export function ProductEmptyState({
	message = 'Nenhum aluno matriculado neste produto.',
	onAddStudent,
}: ProductEmptyStateProps) {
	return (
		<div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/5 py-12 text-center">
			<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<GraduationCap className="h-6 w-6 text-muted-foreground" />
			</div>
			<p className="mb-4 text-muted-foreground text-sm">{message}</p>
			{onAddStudent && (
				<Button onClick={onAddStudent} size="sm" variant="outline">
					<Plus className="mr-2 h-4 w-4" />
					Adicionar aluno
				</Button>
			)}
		</div>
	);
}
