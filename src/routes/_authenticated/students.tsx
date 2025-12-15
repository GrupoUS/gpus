import { api } from '@convex/_generated/api';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import {
	AlertTriangle,
	ChevronLeft,
	ChevronRight,
	GraduationCap,
	LayoutGrid,
	TableIcon,
	User,
	Users,
} from 'lucide-react';
import { useState } from 'react';

import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { StudentCard } from '@/components/students/student-card';
import { StudentFilters } from '@/components/students/student-filters';
import { StudentForm } from '@/components/students/student-form';
import { StudentTimeline } from '@/components/students/student-timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	churnRiskColors,
	productLabels,
	studentStatusLabels,
	studentStatusVariants,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/students')({
	component: StudentsPage,
});

const PAGE_SIZE = 12;

function StudentsPage() {
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('all');
	const [churnRisk, setChurnRisk] = useState('all');
	const [selectedStudent, setSelectedStudent] = useState<Id<'students'> | null>(null);
	const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
	const [page, setPage] = useState(1);

	const navigate = useNavigate();

	const students = useQuery(api.students.list, {
		search: search || undefined,
		status: status === 'all' ? undefined : status,
		churnRisk: churnRisk === 'all' ? undefined : churnRisk,
	});

	// Get enrollments for table view product display
	const enrollments = useQuery(api.enrollments.list, {});

	// Create a map of studentId to their first enrollment product
	const studentProducts =
		enrollments?.reduce(
			(acc: Record<string, string>, e: Doc<'enrollments'>) => {
				if (e.studentId && !acc[e.studentId]) {
					acc[e.studentId] = e.product;
				}
				return acc;
			},
			{} as Record<string, string>,
		) ?? {};

	const clearFilters = () => {
		setSearch('');
		setStatus('all');
		setChurnRisk('all');
		setPage(1);
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
	const handleFilterChange = (
		setter: React.Dispatch<React.SetStateAction<string>>,
		value: string,
	) => {
		setter(value);
		setPage(1);
	};

	const navigateToStudent = (studentId: Id<'students'>) => {
		void navigate({ to: '/students/$studentId', params: { studentId } });
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
							variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
							size="sm"
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('grid')}
						>
							<LayoutGrid className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === 'table' ? 'secondary' : 'ghost'}
							size="sm"
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('table')}
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
				search={search}
				onSearchChange={(v) => handleFilterChange(setSearch, v)}
				status={status}
				onStatusChange={(v) => handleFilterChange(setStatus, v)}
				churnRisk={churnRisk}
				onChurnRiskChange={(v) => handleFilterChange(setChurnRisk, v)}
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
			) : viewMode === 'table' ? (
				/* Table View */
				<Card>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Aluno</TableHead>
									<TableHead>Produto</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Risco</TableHead>
									<TableHead className="w-10" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedStudents.map((student: Doc<'students'>) => {
									const product = studentProducts[student._id];
									return (
										<TableRow
											key={student._id}
											className="cursor-pointer hover:bg-muted/50"
											onClick={() => navigateToStudent(student._id)}
										>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
														<User className="h-4 w-4 text-white" />
													</div>
													<div>
														<p className="font-medium text-sm">{student.name}</p>
														<p className="text-xs text-muted-foreground">{student.profession}</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												{product ? (
													<Badge variant="outline">{productLabels[product] || product}</Badge>
												) : (
													<span className="text-muted-foreground text-sm">-</span>
												)}
											</TableCell>
											<TableCell>
												<Badge variant={studentStatusVariants[student.status]}>
													{studentStatusLabels[student.status]}
												</Badge>
											</TableCell>
											<TableCell>
												{student.churnRisk !== 'baixo' ? (
													<div
														className={cn(
															'flex items-center gap-1',
															churnRiskColors[student.churnRisk],
														)}
													>
														<AlertTriangle className="h-3 w-3" />
														<span className="text-xs font-medium capitalize">
															{student.churnRisk}
														</span>
													</div>
												) : (
													<span className="text-green-500 text-xs font-medium">Baixo</span>
												)}
											</TableCell>
											<TableCell>
												<ChevronRight className="h-4 w-4 text-muted-foreground" />
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
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
							onClick={() => setPage((p) => p - 1)}
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
							onClick={() => setPage((p) => p + 1)}
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
								<Link to="/students/$studentId" params={{ studentId: selectedStudent }}>
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
