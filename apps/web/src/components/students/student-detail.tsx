'use client';

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

import { trpc } from '../../lib/trpc';
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
		(error.message?.includes('Failed to fetch dynamically imported module') ||
			error.message?.includes('Importing a module script failed')) &&
		typeof window !== 'undefined' &&
		!sessionStorage.getItem('chunk_retry')
	) {
		sessionStorage.setItem('chunk_retry', 'true');
		window.location.reload();
		// Return a promise that never resolves to prevent further errors while reloading
		return new Promise<never>(() => {
			// Intentionally never resolve: browser is reloading.
		});
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
	studentId: number | null;
	Component: React.ComponentType<{ studentId: number }>;
}) {
	if (!studentId) return null;
	return <Component studentId={studentId} />;
}

export function StudentDetail({
	studentId,
	onClose,
}: {
	studentId: number | null;
	onClose: () => void;
}) {
	const [activeTab, _setActiveTab] = useState('enrollments');
	const { data: student } = trpc.students.get.useQuery(
		{ id: studentId! },
		{ enabled: !!studentId },
	);
	const { data: enrollments } = trpc.enrollments.listByStudent.useQuery(
		{ studentId: studentId! },
		{ enabled: !!studentId },
	);
	// TODO: Implement activities query via tRPC (was api.activities.listByStudent)
	const activities = [] as { id: number; description: string; type: string; createdAt: Date }[];

	const isOpen = !!studentId;

	return (
		<Sheet onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<SheetContent
				className="flex w-full flex-col overflow-hidden p-0 sm:max-w-3xl"
				side="right"
				transition={{ type: 'spring', stiffness: 150, damping: 22 }}
			>
				{/* Accessibility requirements */}
				<SheetHeader className="sr-only">
					<SheetTitle>Detalhes do Aluno</SheetTitle>
					<SheetDescription>
						Visualize e edite as informações, matrículas e histórico do aluno.
					</SheetDescription>
				</SheetHeader>

				{student ? (
					<>
						{/* Header Section - Fixed */}
						<div className="border-b p-6">
							<div className="flex flex-col items-start gap-6 md:flex-row">
								{/* Avatar */}
								<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-indigo-500">
									<User className="h-10 w-10 text-white" />
								</div>

								{/* Info */}
								<div className="min-w-0 flex-1 space-y-3">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h1 className="font-bold text-2xl">{student.name}</h1>
											<p className="text-muted-foreground">{student.profession}</p>
										</div>
										<Badge className="text-sm" variant={studentStatusVariants[student.status]}>
											{studentStatusLabels[student.status]}
										</Badge>
									</div>

									<Separator />

									{/* Contact Info */}
									<div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
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
										<Button asChild className="gap-2" size="sm" variant="outline">
											<a
												href={`https://wa.me/${(student.phone ?? '').replace(/\D/g, '')}`}
												rel="noopener noreferrer"
												target="_blank"
											>
												<MessageSquare className="h-4 w-4" />
												WhatsApp
											</a>
										</Button>
										<Button asChild className="gap-2" size="sm" variant="outline">
											<a href={`mailto:${student.email}`}>
												<Mail className="h-4 w-4" />
												E-mail
											</a>
										</Button>
										<StudentForm
											studentId={studentId ?? undefined}
											trigger={
												<Button className="gap-2" size="sm" variant="outline">
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
						<div className="grid gap-4 px-6 py-4 md:grid-cols-3">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="font-medium text-sm">Total de Matrículas</CardTitle>
									<GraduationCap className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl">{enrollments?.length ?? 0}</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="font-medium text-sm">Matrículas Ativas</CardTitle>
									<BookOpen className="h-4 w-4 text-green-500" />
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl text-green-600">
										{enrollments?.filter((e) => e.status === 'ativo').length ?? 0}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="font-medium text-sm">Receita Total</CardTitle>
									<CreditCard className="h-4 w-4 text-primary" />
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl text-primary">
										{formatCurrency(
											enrollments?.reduce((sum, e) => sum + (Number(e.totalValue) || 0), 0) ?? 0,
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Tabs - Scrollable */}
						<div className="flex-1 overflow-hidden">
							<Tabs
								className="flex h-full flex-col"
								onValueChange={(v) => _setActiveTab(v)}
								value={activeTab}
							>
								<TabsList className="grid w-full grid-cols-4 px-6">
									<TabsTrigger className="gap-1" value="enrollments">
										<GraduationCap className="h-4 w-4" />
										<span className="hidden sm:inline">Matrículas</span>
									</TabsTrigger>
									<TabsTrigger className="gap-1" value="payments">
										<CreditCard className="h-4 w-4" />
										<span className="hidden sm:inline">Pagamentos</span>
									</TabsTrigger>
									<TabsTrigger className="gap-1" value="timeline">
										<Activity className="h-4 w-4" />
										<span className="hidden sm:inline">Timeline</span>
									</TabsTrigger>
									<TabsTrigger className="gap-1" value="conversations">
										<MessageSquare className="h-4 w-4" />
										<span className="hidden sm:inline">Conversas</span>
									</TabsTrigger>
								</TabsList>

								<ScrollArea className="flex-1 px-6">
									<TabsContent className="mt-4 pb-6" value="enrollments">
										<Suspense
											fallback={
												<div className="grid gap-4 md:grid-cols-2">
													{[1, 2, 3, 4].map((i) => (
														<div className="h-40 animate-pulse rounded-lg bg-muted/20" key={i} />
													))}
												</div>
											}
										>
											<SafeTab Component={StudentEnrollmentsTab} studentId={studentId} />
										</Suspense>
									</TabsContent>

									<TabsContent className="mt-4 pb-6" value="payments">
										<Suspense fallback={<Skeleton className="h-96 w-full" />}>
											<SafeTab Component={StudentPaymentsTab} studentId={studentId} />
										</Suspense>
									</TabsContent>

									<TabsContent className="mt-4 pb-6" value="timeline">
										{!activities || activities.length === 0 ? (
											<div className="py-12 text-center text-muted-foreground">
												<Activity className="mx-auto mb-4 h-12 w-12 opacity-50" />
												<p>Nenhuma atividade registrada</p>
											</div>
										) : (
											<div className="relative ml-3 space-y-6 border-border/50 border-l">
												{activities.map((activity) => (
													<div className="relative pl-6" key={activity.id}>
														<div className="absolute top-1 -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />
														<div className="flex flex-col gap-1">
															<span className="text-muted-foreground text-xs">
																{formatDistanceToNow(activity.createdAt, {
																	addSuffix: true,
																	locale: ptBR,
																})}
															</span>
															<p className="font-medium text-sm">{activity.description}</p>
															<Badge className="w-fit text-xs" variant="outline">
																{activity.type.replace(/_/g, ' ')}
															</Badge>
														</div>
													</div>
												))}
											</div>
										)}
									</TabsContent>

									<TabsContent className="mt-4 pb-6" value="conversations">
										<Suspense
											fallback={
												<div className="space-y-3">
													{[1, 2, 3, 4].map((i) => (
														<div className="h-20 animate-pulse rounded-lg bg-muted/20" key={i} />
													))}
												</div>
											}
										>
											<SafeTab Component={StudentConversationsTab} studentId={studentId} />
										</Suspense>
									</TabsContent>
								</ScrollArea>
							</Tabs>
						</div>
					</>
				) : (
					<div className="space-y-4 p-6">
						<div className="h-32 animate-pulse rounded-lg bg-muted/20" />
						<div className="grid gap-4 md:grid-cols-3">
							{[1, 2, 3].map((i) => (
								<div className="h-24 animate-pulse rounded-lg bg-muted/20" key={i} />
							))}
						</div>
						<div className="h-64 animate-pulse rounded-lg bg-muted/20" />
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
