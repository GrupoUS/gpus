import { GraduationCap } from 'lucide-react';

interface StudentListEmptyStateProps {
	isFiltering: boolean;
	search?: string;
}

export function StudentListEmptyState({ isFiltering, search }: StudentListEmptyStateProps) {
	return (
		<div className="text-center py-12 text-muted-foreground">
			<GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-30" />
			<h2 className="text-lg font-medium">
				{isFiltering ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
			</h2>
			<p className="text-sm mt-2">
				{isFiltering
					? search
						? `Nenhum aluno encontrado para "${search}"`
						: 'Tente ajustar os filtros para ver resultados'
					: 'Adicione novos alunos para vê-los aqui'}
			</p>
		</div>
	);
}
