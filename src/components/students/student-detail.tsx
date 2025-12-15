'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
	Activity,
	ArrowLeft,
	BookOpen,
	Building2,
	CreditCard,
	DollarSign,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, studentStatusLabels, studentStatusVariants } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Lazy loaded tab components for better performance
// Lazy loaded tab components for better performance
const StudentEnrollmentsTab = lazy(() =>
	import('./tabs/student-enrollments-tab').then((module) => ({
		default: module.StudentEnrollmentsTab,
	})),
);
const StudentPaymentsTab = lazy(() =>
	import('./tabs/student-payments-tab').then((module) => ({
		default: module.StudentPaymentsTab,
	})),
);
const StudentConversationsTab = lazy(() =>
	import('./tabs/student-conversations-tab').then((module) => ({
		default: module.StudentConversationsTab,
	})),
);

interface StudentDetailProps {
	studentId: Id<'students'>;
	mode?: 'full' | 'sheet';
}

export function StudentDetail({ studentId, mode = 'full' }: StudentDetailProps) {
	const [activeTab, _setActiveTab] = useState('enrollments');
	const student = useQuery(api.students.getById, { id: studentId });
	const enrollments = useQuery(api.enrollments.getByStudent, { studentId });
	const activities = useQuery(
		api.activities.listByStudent,
		activeTab === 'timeline' ? { studentId } : 'skip',
	);

	if (!student) {
		return (
			<div className="space-y-4 p-6">
				<div className="h-32 bg-muted/20 animate-pulse rounded-lg" />
				<div className="grid gap-4 md:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg" />
					))}
				</div>
				<div className="h-64 bg-muted/20 animate-pulse rounded-lg" />
			</div>
		);
	}
	const totalEnrollments = enrollments?.length ?? 0;
	const activeEnrollments =
		enrollments?.filter((e: Doc<'enrollments'>) => e.status === 'ativo').length ?? 0;
	const totalRevenue =
		enrollments?.reduce((sum: number, e: Doc<'enrollments'>) => sum + e.totalValue, 0) ?? 0;

	return (
		<div className={cn('space-y-6', mode === 'sheet' ? 'p-4' : 'p-6')}>
			{/* Back Button (full mode only) */}
			{mode === 'full' && (
				<Link
					to="/students"
					search={{
						page: 1,
						search: '',
						status: 'all',
						churnRisk: 'all',
						view: 'grid',
					}}
				>
					<Button variant="ghost" size="sm" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						Voltar para lista
					</Button>
				</Link>
			)}

			{/* Header Section */}
			<Card>
				<CardContent className="p-6">
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
								<a
									href={`https://wa.me/${student.phone.replace(/\D/g, '')}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Button variant="outline" size="sm" className="gap-2">
										<MessageSquare className="h-4 w-4" />
										WhatsApp
									</Button>
								</a>
								<a href={`mailto:${student.email}`}>
									<Button variant="outline" size="sm" className="gap-2">
										<Mail className="h-4 w-4" />
										E-mail
									</Button>
								</a>
								<StudentForm
									studentId={studentId}
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
				</CardContent>
			</Card>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total de Matrículas</CardTitle>
						<GraduationCap className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalEnrollments}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
						<BookOpen className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">{activeEnrollments}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Receita Total</CardTitle>
						<DollarSign className="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={(v) => _setActiveTab(v)} className="w-full">
				<TabsList className="grid w-full grid-cols-4">
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

				{/* Enrollments Tab */}
				<TabsContent value="enrollments" className="mt-4">
					<Suspense
						fallback={
							<div className="grid gap-4 md:grid-cols-2">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="h-40 bg-muted/20 animate-pulse rounded-lg" />
								))}
							</div>
						}
					>
						<StudentEnrollmentsTab studentId={studentId} />
					</Suspense>
				</TabsContent>

				{/* Payments Tab */}
				<TabsContent value="payments" className="mt-4">
					<Suspense fallback={<Skeleton className="h-96 w-full" />}>
						<StudentPaymentsTab studentId={studentId} />
					</Suspense>
				</TabsContent>

				{/* Timeline Tab */}
				<TabsContent value="timeline" className="mt-4">
					<ScrollArea className="h-[400px]">
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
					</ScrollArea>
				</TabsContent>

				{/* Conversations Tab */}
				<TabsContent value="conversations" className="mt-4">
					<Suspense
						fallback={
							<div className="space-y-3">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="h-20 bg-muted/20 animate-pulse rounded-lg" />
								))}
							</div>
						}
					>
						<StudentConversationsTab studentId={studentId} />
					</Suspense>
				</TabsContent>
			</Tabs>
		</div>
	);
}
