import { useNavigate } from '@tanstack/react-router';
import { GraduationCap, LayoutGrid, TableIcon } from 'lucide-react';

import { StudentForm } from '@/components/students/student-form';
import { StudentImportDialog } from '@/components/students/student-import-dialog';
import { Button } from '@/components/ui/button';

interface StudentHeaderProps {
	view: 'grid' | 'table';
	search: string;
	status: string;
	churnRisk: string;
	product: string;
	page: number;
}

export function StudentHeader({
	view,
	search,
	status,
	churnRisk,
	product,
	page,
}: StudentHeaderProps) {
	const navigate = useNavigate();

	const handleViewChange = (newView: 'grid' | 'table') => {
		void navigate({
			to: '/students',
			search: { search, status, churnRisk, product, page, view: newView },
		});
	};

	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="text-2xl font-bold flex items-center gap-2">
					<GraduationCap className="h-6 w-6 text-purple-500" />
					Alunos
				</h1>
				<p className="text-muted-foreground">Gerencie seus alunos e matrículas</p>
			</div>
			<div className="flex items-center gap-2">
				{/* View Toggle */}
				<div className="flex gap-1 border rounded-md p-1">
					<Button
						variant={view === 'grid' ? 'secondary' : 'ghost'}
						size="sm"
						className="h-8 w-8 p-0"
						onClick={() => handleViewChange('grid')}
					>
						<LayoutGrid className="h-4 w-4" />
					</Button>
					<Button
						variant={view === 'table' ? 'secondary' : 'ghost'}
						size="sm"
						className="h-8 w-8 p-0"
						onClick={() => handleViewChange('table')}
					>
						<TableIcon className="h-4 w-4" />
					</Button>
				</div>
				<StudentImportDialog />
				<StudentForm />
			</div>
		</div>
	);
}
