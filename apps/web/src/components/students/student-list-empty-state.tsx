import { GraduationCap } from 'lucide-react';

interface StudentListEmptyStateProps {
	isFiltering: boolean;
	search?: string;
}

export function StudentListEmptyState({ isFiltering, search }: StudentListEmptyStateProps) {
	const title = isFiltering ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado';
	const getEmptyMessage = () => {
		if (isFiltering) {
			return search
				? `Nenhum aluno encontrado para "${search}"`
				: 'Tente ajustar os filtros para ver resultados';
		}
		return 'Adicione novos alunos para vê-los aqui';
	};

	return (
		<div className="py-12 text-center text-muted-foreground">
			<GraduationCap className="mx-auto mb-4 h-16 w-16 opacity-30" />
			<h2 className="font-medium text-lg">{title}</h2>
			<p className="mt-2 text-sm">{getEmptyMessage()}</p>
		</div>
	);
}
