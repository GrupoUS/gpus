import { createFileRoute } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';

import { StudentCard } from '@/components/students/student-card';
import { StudentFilters } from '@/components/students/student-filters';
import { StudentHeader } from '@/components/students/student-header';
import { StudentStats } from '@/components/students/student-stats';
import { StudentsTable } from '@/components/students/student-table';
import { Button } from '@/components/ui/button';
import { useStudentsViewModel } from '@/hooks/use-students-view-model';

export const Route = createFileRoute('/_authenticated/students')({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			search: (search.search as string) || '',
			status: (search.status as string) || 'all',
			churnRisk: (search.churnRisk as string) || 'all',
			product: (search.product as string) || 'all',
			view: ((search.view as string) || 'grid') === 'table' ? 'table' : 'grid',
			page: Math.max(1, Number(search.page) || 1),
		};
	},
	component: StudentsPage,
});

function StudentsPage() {
	const {
		search,
		status,
		churnRisk,
		product,
		view,
		page,
		students,
		paginatedStudents,
		totalStudents,
		activeStudents,
		highRiskStudents,
		totalPages,
		clearFilters,
		handleFilterChange,
		navigateToStudent,
		navigate,
		PAGE_SIZE,
	} = useStudentsViewModel(Route);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<StudentHeader
				view={view as 'grid' | 'table'}
				search={search}
				status={status}
				churnRisk={churnRisk}
				product={product}
				page={page}
			/>

			{/* Stats Cards */}
			<StudentStats
				totalStudents={totalStudents}
				activeStudents={activeStudents}
				highRiskStudents={highRiskStudents}
			/>

			{/* Filters */}
			<StudentFilters
				search={search || ''}
				onSearchChange={(v) => handleFilterChange('search', v)}
				status={status || 'all'}
				onStatusChange={(v) => handleFilterChange('status', v)}
				churnRisk={churnRisk || 'all'}
				onChurnRiskChange={(v) => handleFilterChange('churnRisk', v)}
				product={product || 'all'}
				onProductChange={(v) => handleFilterChange('product', v)}
				onClear={clearFilters}
			/>

			{/* Students List */}
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
			) : view === 'table' ? (
				/* Table View */
				<StudentsTable students={paginatedStudents} onStudentClick={navigateToStudent} />
			) : (
				/* Grid View */
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{paginatedStudents.map((student) => (
						<StudentCard
							key={student._id}
							student={student}
							onClick={() => navigateToStudent(student._id)}
						/>
					))}
				</div>
			)}

			{/* Pagination */}
			{students && students.length > PAGE_SIZE && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalStudents)} de{' '}
						{totalStudents} alunos
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page === 1}
							onClick={() => {
								void navigate({
									to: '/students',
									search: { ...{ search, status, churnRisk, product, view }, page: page - 1 },
								});
							}}
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
							onClick={() => {
								void navigate({
									to: '/students',
									search: { ...{ search, status, churnRisk, product, view }, page: page + 1 },
								});
							}}
						>
							Próximo
							<ChevronRight className="h-4 w-4 ml-1" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
