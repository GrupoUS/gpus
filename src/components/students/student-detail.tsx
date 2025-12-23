'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
	Activity,
	BookOpen,
	Building2,
	CreditCard,
	Edit,
	GraduationCap,
	Mail,
	MessageSquare,
	Phone,
	User,
} from 'lucide-react';
import { lazy, Suspense, useState } from 'react';

import { StudentForm } from './student-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, studentStatusLabels, studentStatusVariants } from '@/lib/constants';

// Helper to handle chunk load errors (e.g., after a new deployment)
const handleChunkError = (error: Error): Promise<never> => {
	if (
		error.message?.includes('Failed to fetch dynamically imported module') ||
		error.message?.includes('Importing a module script failed')
	) {
		if (typeof window !== 'undefined' && !sessionStorage.getItem('chunk_retry')) {
			sessionStorage.setItem('chunk_retry', 'true');
			window.location.reload();
			// Return a promise that never resolves to prevent further errors while reloading
			return new Promise<never>(() => {
				// Intentionally never resolve: browser is reloading.
			});
		}
	}
	throw error;
};

// Lazy loaded tab components for better performance
const StudentEnrollmentsTab = lazy(() =>
	import('./tabs/student-enrollments-tab')
		.then((module) => ({
			default: module.StudentEnrollmentsTab,
		}))
		.catch(handleChunkError),
);
const StudentPaymentsTab = lazy(() =>
	import('./tabs/student-payments-tab')
		.then((module) => ({
			default: module.StudentPaymentsTab,
		}))
		.catch(handleChunkError),
);
const StudentConversationsTab = lazy(() =>
	import('./tabs/student-conversations-tab')
		.then((module) => ({
			default: module.StudentConversationsTab,
		}))
		.catch(handleChunkError),
);

// Helper to safely render tabs that require a non-null studentId
function SafeTab({
	studentId,
	Component,
}: {
	studentId: Id<'students'> | null;
	Component: React.ComponentType<{ studentId: Id<'students'> }>;
}) {
	if (!studentId) return null;
	return <Component studentId={studentId} />;
}

export function StudentDetail({
	studentId,
	onClose,
}: {
	studentId: Id<'students'> | null;
	onClose: () => void;
}) {
	const [activeTab, _setActiveTab] = useState('enrollments');
	const student = useQuery(api.students.getById, studentId ? { id: studentId } : 'skip');
	const enrollments = useQuery(api.enrollments.getByStudent, studentId ? { studentId } : 'skip');
	const activities = useQuery(
		api.activities.listByStudent,
		activeTab === 'timeline' && studentId ? { studentId } : 'skip',
	);

	const isOpen = !!studentId;

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent
				side="right"
				transition={{ type: 'spring', stiffness: 150, damping: 22 }}
				className="w-full sm:max-w-3xl p-0 flex flex-col overflow-hidden"
			>
				{/* Accessibility requirements */}
				<SheetHeader className="sr-only">
					<SheetTitle>Detalhes do Aluno</SheetTitle>
					<SheetDescription>
						Visualize e edite as informações, matrículas e histórico do aluno.
					</SheetDescription>
				</SheetHeader>

				{!student ? (
					<div className="space-y-4 p-6">
						<div className="h-32 bg-muted/20 animate-pulse rounded-lg" />
						<div className="grid gap-4 md:grid-cols-3">
							{[1, 2, 3].map((i) => (
								<div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg" />
							))}
						</div>
						<div className="h-64 bg-muted/20 animate-pulse rounded-lg" />
					</div>
				) : (
					<>
						{/* Header Section - Fixed */}
						<div className="p-6 border-b">
							<div className="flex flex-col md:flex-row items-start gap-6">
								{/* Avatar */}
								<div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
									<User className="h-10 w-10 text-white" />
								</div>

								{/* Info */}
								<div className="flex-1 min-w-0 space-y-3">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h1 className="text-2xl font-bold">{student.name}</h1>
											<p className="text-muted-foreground">{student.profession}</p>
										</div>
										<Badge variant={studentStatusVariants[student.status]} className="text-sm">
											{studentStatusLabels[student.status]}
										</Badge>
									</div>

									<Separator />

									{/* Contact Info */}
									<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
										<span className="flex items-center gap-2">
											<Phone className="h-4 w-4" />
											{student.phone}
										</span>
										<span className="flex items-center gap-2">
											<Mail className="h-4 w-4" />
											{student.email}
										</span>
										{student.hasClinic && student.clinicName && (
											<span className="flex items-center gap-2">
												<Building2 className="h-4 w-4" />
												{student.clinicName}
												{student.clinicCity && ` - ${student.clinicCity}`}
											</span>
										)}
									</div>

									{/* Actions */}
									<div className="flex flex-wrap gap-2 pt-2">
										<Button asChild variant="outline" size="sm" className="gap-2">
											<a
												href={`https://wa.me/${student.phone.replace(/\D/g, '')}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												<MessageSquare className="h-4 w-4" />
												WhatsApp
											</a>
										</Button>
										<Button asChild variant="outline" size="sm" className="gap-2">
											<a href={`mailto:${student.email}`}>
												<Mail className="h-4 w-4" />
												E-mail
											</a>
										</Button>
										<StudentForm
											studentId={studentId ?? undefined}
											trigger={
												<Button variant="outline" size="sm" className="gap-2">
													<Edit className="h-4 w-4" />
													Editar
												</Button>
											}
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Stats Cards */}
						<div className="px-6 py-4 grid gap-4 md:grid-cols-3">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium">Total de Matrículas</CardTitle>
									<GraduationCap className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{enrollments?.length ?? 0}</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
									<BookOpen className="h-4 w-4 text-green-500" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold text-green-600">
										{enrollments?.filter((e: Doc<'enrollments'>) => e.status === 'ativo').length ??
											0}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium">Receita Total</CardTitle>
									<CreditCard className="h-4 w-4 text-primary" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold text-primary">
										{formatCurrency(
											enrollments?.reduce(
												(sum: number, e: Doc<'enrollments'>) => sum + e.totalValue,
												0,
											) ?? 0,
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Tabs - Scrollable */}
						<div className="flex-1 overflow-hidden">
							<Tabs
								value={activeTab}
								onValueChange={(v) => _setActiveTab(v)}
								className="h-full flex flex-col"
							>
								<TabsList className="px-6 grid w-full grid-cols-4">
									<TabsTrigger value="enrollments" className="gap-1">
										<GraduationCap className="h-4 w-4" />
										<span className="hidden sm:inline">Matrículas</span>
									</TabsTrigger>
									<TabsTrigger value="payments" className="gap-1">
										<CreditCard className="h-4 w-4" />
										<span className="hidden sm:inline">Pagamentos</span>
									</TabsTrigger>
									<TabsTrigger value="timeline" className="gap-1">
										<Activity className="h-4 w-4" />
										<span className="hidden sm:inline">Timeline</span>
									</TabsTrigger>
									<TabsTrigger value="conversations" className="gap-1">
										<MessageSquare className="h-4 w-4" />
										<span className="hidden sm:inline">Conversas</span>
									</TabsTrigger>
								</TabsList>

								<ScrollArea className="flex-1 px-6">
									<TabsContent value="enrollments" className="mt-4 pb-6">
										<Suspense
											fallback={
												<div className="grid gap-4 md:grid-cols-2">
													{[1, 2, 3, 4].map((i) => (
														<div key={i} className="h-40 bg-muted/20 animate-pulse rounded-lg" />
													))}
												</div>
											}
										>
											<SafeTab studentId={studentId} Component={StudentEnrollmentsTab} />
										</Suspense>
									</TabsContent>

									<TabsContent value="payments" className="mt-4 pb-6">
										<Suspense fallback={<Skeleton className="h-96 w-full" />}>
											<SafeTab studentId={studentId} Component={StudentPaymentsTab} />
										</Suspense>
									</TabsContent>

									<TabsContent value="timeline" className="mt-4 pb-6">
										{!activities || activities.length === 0 ? (
											<div className="text-center py-12 text-muted-foreground">
												<Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
												<p>Nenhuma atividade registrada</p>
											</div>
										) : (
											<div className="relative border-l border-border/50 ml-3 space-y-6">
												{activities.map((activity: Doc<'activities'>) => (
													<div key={activity._id} className="relative pl-6">
														<div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background ring-2 ring-primary/20" />
														<div className="flex flex-col gap-1">
															<span className="text-xs text-muted-foreground">
																{formatDistanceToNow(activity.createdAt, {
																	addSuffix: true,
																	locale: ptBR,
																})}
															</span>
															<p className="text-sm font-medium">{activity.description}</p>
															<Badge variant="outline" className="w-fit text-xs">
																{activity.type.replace(/_/g, ' ')}
															</Badge>
														</div>
													</div>
												))}
											</div>
										)}
									</TabsContent>

									<TabsContent value="conversations" className="mt-4 pb-6">
										<Suspense
											fallback={
												<div className="space-y-3">
													{[1, 2, 3, 4].map((i) => (
														<div key={i} className="h-20 bg-muted/20 animate-pulse rounded-lg" />
													))}
												</div>
											}
										>
											<SafeTab studentId={studentId} Component={StudentConversationsTab} />
										</Suspense>
									</TabsContent>
								</ScrollArea>
							</Tabs>
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}
