'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { BookOpen } from 'lucide-react';

import { EnrollmentCard } from '../enrollment-card';

interface StudentEnrollmentsTabProps {
	studentId: Id<'students'>;
}

export function StudentEnrollmentsTab({ studentId }: StudentEnrollmentsTabProps) {
	const enrollments = useQuery(api.enrollments.getByStudent, { studentId });

	if (!enrollments) {
		return (
			<div className="grid gap-4 md:grid-cols-2">
				{[1, 2, 3, 4].map((i) => (
					<div className="h-40 animate-pulse rounded-lg bg-muted/20" key={i} />
				))}
			</div>
		);
	}

	if (enrollments.length === 0) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				<BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
				<p>Nenhuma matrícula encontrada</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{enrollments.map((enrollment: Doc<'enrollments'>) => (
				<EnrollmentCard enrollment={enrollment} key={enrollment._id} />
			))}
		</div>
	);
}
