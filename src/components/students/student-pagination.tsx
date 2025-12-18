import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface StudentPaginationProps {
	page: number;
	totalPages: number;
	totalStudents: number;
	pageSize: number;
	onPageChange: (newPage: number) => void;
}

export function StudentPagination({
	page,
	totalPages,
	totalStudents,
	pageSize,
	onPageChange,
}: StudentPaginationProps) {
	return (
		<div className="flex items-center justify-between pt-4 border-t">
			<p className="text-sm text-muted-foreground">
				Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalStudents)} de{' '}
				{totalStudents} alunos
			</p>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={page === 1}
					onClick={() => onPageChange(page - 1)}
				>
					<ChevronLeft className="h-4 w-4 mr-1" />
					Anterior
				</Button>
				<span className="text-sm text-muted-foreground">
					{page} / {totalPages}
				</span>
				<Button
					variant="outline"
					size="sm"
					disabled={page === totalPages}
					onClick={() => onPageChange(page + 1)}
				>
					Próximo
					<ChevronRight className="h-4 w-4 ml-1" />
				</Button>
			</div>
		</div>
	);
}
