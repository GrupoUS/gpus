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
		<div className="flex flex-col items-center justify-center py-12 text-center col-span-full bg-muted/5 rounded-lg border border-dashed">
			<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
				<GraduationCap className="h-6 w-6 text-muted-foreground" />
			</div>
			<p className="text-sm text-muted-foreground mb-4">{message}</p>
			{onAddStudent && (
				<Button variant="outline" size="sm" onClick={onAddStudent}>
					<Plus className="w-4 h-4 mr-2" />
					Adicionar aluno
				</Button>
			)}
		</div>
	);
}
