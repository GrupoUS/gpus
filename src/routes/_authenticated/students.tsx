import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { GraduationCap, Users } from 'lucide-react';
import { useState } from 'react';

import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { StudentCard } from '@/components/students/student-card';
import { StudentFilters } from '@/components/students/student-filters';
import { StudentForm } from '@/components/students/student-form';
import { StudentTimeline } from '@/components/students/student-timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export const Route = createFileRoute('/_authenticated/students')({
	component: StudentsPage,
});

function StudentsPage() {
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('all');
	const [churnRisk, setChurnRisk] = useState('all');
	const [selectedStudent, setSelectedStudent] = useState<Id<'students'> | null>(null);

	const students = useQuery(api.students.list, {
		search: search || undefined,
		status: status === 'all' ? undefined : status,
		churnRisk: churnRisk === 'all' ? undefined : churnRisk,
	});

	const clearFilters = () => {
		setSearch('');
		setStatus('all');
		setChurnRisk('all');
	};

	// Stats
	const totalStudents = students?.length ?? 0;
	const activeStudents = students?.filter((s: Doc<'students'>) => s.status === 'ativo').length ?? 0;
	const highRiskStudents =
		students?.filter((s: Doc<'students'>) => s.churnRisk === 'alto').length ?? 0;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<GraduationCap className="h-6 w-6 text-purple-500" />
						Alunos
					</h1>
					<p className="text-muted-foreground">Gerencie seus alunos e matrículas</p>
				</div>
				<StudentForm />
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalStudents}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
						<GraduationCap className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">{activeStudents}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Risco de Churn</CardTitle>
						<Users className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">{highRiskStudents}</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<StudentFilters
				search={search}
				onSearchChange={setSearch}
				status={status}
				onStatusChange={setStatus}
				churnRisk={churnRisk}
				onChurnRiskChange={setChurnRisk}
				onClear={clearFilters}
			/>

			{/* Students Grid */}
			{!students ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div key={i} className="h-40 bg-muted/20 animate-pulse rounded-lg" />
					))}
				</div>
			) : students.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					<GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-30" />
					<h2 className="text-lg font-medium">Nenhum aluno encontrado</h2>
					<p className="text-sm">Tente ajustar os filtros ou adicione um novo aluno</p>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{students.map((student: Doc<'students'>) => (
						<StudentCard
							key={student._id}
							student={student}
							onClick={() => setSelectedStudent(student._id)}
							onEdit={(id) => {
								// Open edit dialog - could use state to track edit mode
								setSelectedStudent(id);
							}}
						/>
					))}
				</div>
			)}

			{/* Student Detail Sheet */}
			<Sheet open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
				<SheetContent className="sm:max-w-xl w-full overflow-y-auto">
					{selectedStudent && <StudentTimeline studentId={selectedStudent} />}
				</SheetContent>
			</Sheet>
		</div>
	);
}
