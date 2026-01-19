import { GraduationCap } from 'lucide-react';

interface StudentListEmptyStateProps {
	isFiltering: boolean;
	search?: string;
}

export function StudentListEmptyState({ isFiltering, search }: StudentListEmptyStateProps) {
	return (
		<div className="py-12 text-center text-muted-foreground">
			<GraduationCap className="mx-auto mb-4 h-16 w-16 opacity-30" />
			<h2 className="font-medium text-lg">
				{isFiltering ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
			</h2>
			<p className="mt-2 text-sm">
				{isFiltering
					? search
						? `Nenhum aluno encontrado para "${search}"`
						: 'Tente ajustar os filtros para ver resultados'
					: 'Adicione novos alunos para vê-los aqui'}
			</p>
		</div>
	);
}
