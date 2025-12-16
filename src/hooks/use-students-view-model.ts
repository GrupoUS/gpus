import { api } from '@convex/_generated/api';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { useEffect } from 'react';

import type { Id } from '../../convex/_generated/dataModel';

const PAGE_SIZE = 12;

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useStudentsViewModel(Route: any) {
	const navigate = useNavigate();
	const { search, status, churnRisk, product, view, page } = Route.useSearch();

	// Set default search params
	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const hasAnyParam = searchParams.toString().length > 0;

		if (!hasAnyParam) {
			void navigate({
				to: '/students',
				search: {
					view: 'grid',
					page: 1,
					search: '',
					status: 'all',
					churnRisk: 'all',
					product: 'all',
				},
			});
		}
	}, [navigate]);

	const students = useQuery(api.students.list, {
		search: search || undefined,
		status: status === 'all' ? undefined : status,
		churnRisk: churnRisk === 'all' ? undefined : churnRisk,
		product: product === 'all' ? undefined : product,
	});

	const clearFilters = () => {
		void navigate({
			to: '/students',
			search: {
				view: 'grid',
				page: 1,
				search: '',
				status: 'all',
				churnRisk: 'all',
				product: 'all',
			},
		});
	};

	// Stats
	const totalStudents = students?.length ?? 0;
	const activeStudents = students?.filter((s) => s && s.status === 'ativo').length ?? 0;
	const highRiskStudents = students?.filter((s) => s && s.churnRisk === 'alto').length ?? 0;

	// Pagination
	const totalPages = Math.ceil(totalStudents / PAGE_SIZE);
	const paginatedStudents = (
		students?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? []
	).filter((s): s is NonNullable<typeof s> => s !== null);

	// Reset page when filters change
	const handleFilterChange = (key: string, value: string) => {
		void navigate({
			to: '/students',
			search: { ...{ search, status, churnRisk, product, view, page }, [key]: value, page: 1 },
		});
	};

	const navigateToStudent = (studentId: Id<'students'>) => {
		void navigate({
			to: '/students/$studentId',
			params: { studentId },
			search: {
				page,
				search,
				status,
				churnRisk,
				product,
				view,
			},
		});
	};

	return {
		search,
		status,
		churnRisk,
		product,
		view,
		page,
		students,
		paginatedStudents,
		totalStudents,
		activeStudents,
		highRiskStudents,
		totalPages,
		PAGE_SIZE,
		clearFilters,
		handleFilterChange,
		navigateToStudent,
		navigate, // Exposed if needed, but navigateToStudent covers the main case
	};
}
