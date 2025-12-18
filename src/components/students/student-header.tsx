import { GraduationCap } from 'lucide-react';

import { StudentForm } from '@/components/students/student-form';
import { StudentImportDialog } from '@/components/students/student-import-dialog';

export function StudentHeader() {
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
				<StudentImportDialog />
				<StudentForm />
			</div>
		</div>
	);
}
