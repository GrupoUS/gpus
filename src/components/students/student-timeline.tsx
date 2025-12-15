'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
	Activity,
	BookOpen,
	Edit,
	GraduationCap,
	Mail,
	Phone,
	TrendingUp,
	User,
} from 'lucide-react';

import { EnrollmentCard } from './enrollment-card';
import { StudentForm } from './student-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StudentTimelineProps {
	studentId: Id<'students'>;
}

export function StudentTimeline({ studentId }: StudentTimelineProps) {
	const student = useQuery(api.students.getById, { id: studentId });
	const enrollments = useQuery(api.enrollments.getByStudent, { studentId });
	const activities = useQuery(api.activities.listByStudent, { studentId });

	if (!student) {
		return (
			<div className="space-y-4 p-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg" />
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Student Header */}
			<div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/10">
				<div className="w-14 h-14 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
					<User className="h-7 w-7 text-white" />
				</div>
				<div className="flex-1 min-w-0">
					<h2 className="text-lg font-bold">{student.name}</h2>
					<p className="text-sm text-muted-foreground">{student.profession}</p>
					<div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
						<span className="flex items-center gap-1">
							<Phone className="h-4 w-4" />
							{student.phone}
						</span>
						<span className="flex items-center gap-1">
							<Mail className="h-4 w-4" />
							{student.email}
						</span>
					</div>
				</div>
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

			{/* Tabs */}
			<Tabs defaultValue="enrollments" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="enrollments" className="gap-1">
						<GraduationCap className="h-4 w-4" />
						Matrículas
					</TabsTrigger>
					<TabsTrigger value="progress" className="gap-1">
						<TrendingUp className="h-4 w-4" />
						Progresso
					</TabsTrigger>
					<TabsTrigger value="activities" className="gap-1">
						<Activity className="h-4 w-4" />
						Atividades
					</TabsTrigger>
				</TabsList>

				{/* Enrollments Tab */}
				<TabsContent value="enrollments" className="mt-4">
					{!enrollments || enrollments.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>Nenhuma matrícula encontrada</p>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							{enrollments.map((enrollment: Doc<'enrollments'>) => (
								<EnrollmentCard key={enrollment._id} enrollment={enrollment} />
							))}
						</div>
					)}
				</TabsContent>

				{/* Progress Tab */}
				<TabsContent value="progress" className="mt-4">
					<div className="space-y-4">
						{!enrollments ||
						enrollments.filter((e: Doc<'enrollments'>) => e.status === 'ativo').length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>Nenhum curso ativo</p>
							</div>
						) : (
							(enrollments || [])
								.filter((e: Doc<'enrollments'>) => e.status === 'ativo')
								.map((enrollment: Doc<'enrollments'>) => (
									<EnrollmentCard key={enrollment._id} enrollment={enrollment} />
								))
						)}
					</div>
				</TabsContent>

				{/* Activities Tab */}
				<TabsContent value="activities" className="mt-4">
					<ScrollArea className="h-[400px]">
						{!activities || activities.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
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
			</Tabs>
		</div>
	);
}
