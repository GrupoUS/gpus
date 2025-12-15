import type { Id } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';

import { StudentDetail } from '@/components/students/student-detail';

export const Route = createFileRoute('/_authenticated/students/$studentId')({
	component: StudentDetailPage,
});

function StudentDetailPage() {
	const { studentId } = Route.useParams();

	return <StudentDetail studentId={studentId as Id<'students'>} mode="full" />;
}
