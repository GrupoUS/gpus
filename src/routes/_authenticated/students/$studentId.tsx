import type { Id } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';

import { StudentDetail } from '@/components/students/student-detail';

export const Route = createFileRoute('/_authenticated/students/$studentId')({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			search: (search.search as string) || '',
			status: (search.status as string) || 'all',
			churnRisk: (search.churnRisk as string) || 'all',
			product: (search.product as string) || 'all',
			view: ((search.view as string) || 'grid') === 'table' ? 'table' : 'grid',
			page: Math.max(1, Number(search.page) || 1),
		};
	},
	component: StudentDetailPage,
});

function StudentDetailPage() {
	const { studentId } = Route.useParams();
	const listSearch = Route.useSearch();

	return (
		<StudentDetail studentId={studentId as Id<'students'>} mode="full" listSearch={listSearch} />
	);
}
