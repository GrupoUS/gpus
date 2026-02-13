'use client';

import { BookOpen } from 'lucide-react';

import { trpc } from '../../../lib/trpc';
import { EnrollmentCard } from '../enrollment-card';
import type { Enrollment } from '@/types/api';

interface StudentEnrollmentsTabProps {
	studentId: number;
}

export function StudentEnrollmentsTab({ studentId }: StudentEnrollmentsTabProps) {
	const { data: enrollments } = trpc.enrollments.listByStudent.useQuery({ studentId });

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
			{enrollments.map((enrollment: Enrollment) => (
				<EnrollmentCard enrollment={enrollment} key={enrollment.id} />
			))}
		</div>
	);
}
