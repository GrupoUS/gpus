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
		<div className="flex items-center justify-between border-t pt-4">
			<p className="text-muted-foreground text-sm">
				Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalStudents)} de{' '}
				{totalStudents} alunos
			</p>
			<div className="flex items-center gap-2">
				<Button
					disabled={page === 1}
					onClick={() => onPageChange(page - 1)}
					size="sm"
					variant="outline"
				>
					<ChevronLeft className="mr-1 h-4 w-4" />
					Anterior
				</Button>
				<span className="text-muted-foreground text-sm">
					{page} / {totalPages}
				</span>
				<Button
					disabled={page === totalPages}
					onClick={() => onPageChange(page + 1)}
					size="sm"
					variant="outline"
				>
					Próximo
					<ChevronRight className="ml-1 h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
