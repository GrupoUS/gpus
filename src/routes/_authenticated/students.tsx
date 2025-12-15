import { api } from '@convex/_generated/api';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import {
	ChevronLeft,
	ChevronRight,
	GraduationCap,
	LayoutGrid,
	TableIcon,
	Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { StudentCard } from '@/components/students/student-card';
import { StudentFilters } from '@/components/students/student-filters';
import { StudentForm } from '@/components/students/student-form';
import { StudentsTable } from '@/components/students/student-table';
import { StudentTimeline } from '@/components/students/student-timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export const Route = createFileRoute('/_authenticated/students')({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			search: (search.search as string) || '',
			status: (search.status as string) || 'all',
			churnRisk: (search.churnRisk as string) || 'all',
			view: ((search.view as string) || 'grid') === 'table' ? 'table' : 'grid',
			page: Math.max(1, Number(search.page) || 1),
		};
	},
	component: StudentsPage,
});

const PAGE_SIZE = 12;

function StudentsPage() {
	const navigate = useNavigate();
	const { search, status, churnRisk, view, page } = Route.useSearch();
	const [selectedStudent, setSelectedStudent] = useState<Id<'students'> | null>(null);

	// Set default search params
	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const hasAnyParam = searchParams.toString().length > 0;

		if (!hasAnyParam) {
			void navigate({
				to: '/students',
				search: { view: 'grid', page: 1, search: '', status: 'all', churnRisk: 'all' },
			});
		}
	}, [navigate]);

	const students = useQuery(api.students.list, {
		search: search || undefined,
		status: status === 'all' ? undefined : status,
		churnRisk: churnRisk === 'all' ? undefined : churnRisk,
	});

	const clearFilters = () => {
		void navigate({
			to: '/students',
			search: { view, page: 1, search: '', status: 'all', churnRisk: 'all' },
		});
	};

	// Stats
	const totalStudents = students?.length ?? 0;
	const activeStudents = students?.filter((s: Doc<'students'>) => s.status === 'ativo').length ?? 0;
	const highRiskStudents =
		students?.filter((s: Doc<'students'>) => s.churnRisk === 'alto').length ?? 0;

	// Pagination
	const totalPages = Math.ceil(totalStudents / PAGE_SIZE);
	const paginatedStudents = students?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

	// Reset page when filters change
	const handleFilterChange = (key: string, value: string) => {
		void navigate({
			to: '/students',
			search: { ...{ search, status, churnRisk, view, page }, [key]: value, page: 1 },
		});
	};

	const navigateToStudent = (studentId: Id<'students'>) => {
		void navigate({
			to: '/students/$studentId',
			params: { studentId },
			search: {
				page,
				search,
				status,
				churnRisk,
				view,
			},
		});
	};

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
				<div className="flex items-center gap-2">
					{/* View Toggle */}
					<div className="flex gap-1 border rounded-md p-1">
						<Button
							variant={view === 'grid' ? 'secondary' : 'ghost'}
							size="sm"
							className="h-8 w-8 p-0"
							onClick={() => {
								void navigate({
									to: '/students',
									search: { ...{ search, status, churnRisk, page }, view: 'grid' },
								});
							}}
						>
							<LayoutGrid className="h-4 w-4" />
						</Button>
						<Button
							variant={view === 'table' ? 'secondary' : 'ghost'}
							size="sm"
							className="h-8 w-8 p-0"
							onClick={() => {
								void navigate({
									to: '/students',
									search: { ...{ search, status, churnRisk, page }, view: 'table' },
								});
							}}
						>
							<TableIcon className="h-4 w-4" />
						</Button>
					</div>
					<StudentForm />
				</div>
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
				search={search || ''}
				onSearchChange={(v) => handleFilterChange('search', v)}
				status={status || 'all'}
				onStatusChange={(v) => handleFilterChange('status', v)}
				churnRisk={churnRisk || 'all'}
				onChurnRiskChange={(v) => handleFilterChange('churnRisk', v)}
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
					{paginatedStudents.map((student: Doc<'students'>) => (
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
									search: { ...{ search, status, churnRisk, view }, page: page - 1 },
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
									search: { ...{ search, status, churnRisk, view }, page: page + 1 },
								});
							}}
						>
							Próximo
							<ChevronRight className="h-4 w-4 ml-1" />
						</Button>
					</div>
				</div>
			)}

			{/* Student Detail Sheet (Quick Preview) */}
			<Sheet open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
				<SheetContent className="sm:max-w-xl w-full overflow-y-auto">
					{selectedStudent && (
						<div className="space-y-4">
							<StudentTimeline studentId={selectedStudent} />
							<div className="pt-4 border-t">
								<Link
									to="/students/$studentId"
									params={{ studentId: selectedStudent }}
									search={{
										page: 1,
										search: '',
										status: 'all',
										churnRisk: 'all',
										view: 'grid',
									}}
								>
									<Button className="w-full">Ver Perfil Completo</Button>
								</Link>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
