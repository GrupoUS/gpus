'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { BookOpen } from 'lucide-react';

import { EnrollmentCard } from '../enrollment-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentEnrollmentsTabProps {
	studentId: Id<'students'>;
}

export function StudentEnrollmentsTab({ studentId }: StudentEnrollmentsTabProps) {
	const enrollments = useQuery(api.enrollments.getByStudent, { studentId });

	if (!enrollments) {
		return (
			<div className="grid gap-4 md:grid-cols-2">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-5 w-20" />
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (enrollments.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				<BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
				<p>Nenhuma matrícula encontrada</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{enrollments.map((enrollment: Doc<'enrollments'>) => (
				<EnrollmentCard key={enrollment._id} enrollment={enrollment} />
			))}
		</div>
	);
}
