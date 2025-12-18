import { api } from '@convex/_generated/api';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import React, { useEffect } from 'react';

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

	// Pagination logic
	// For 'table' view, we use standard pagination.
	// For 'grid' view (Product-Centric), we usually want to see all students grouped.
	// However, to prevent performance issues with large datasets, we keep pagination active.
	// This means groups might be split across pages.
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

	// Grouping Logic for Product-Centric View
	const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
		trintae3: true,
		otb: true,
		black_neon: true,
		comunidade: true,
		auriculo: true,
		na_mesa_certa: true,
		sem_produto: true,
	});

	const toggleSection = (productId: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[productId]: !prev[productId],
		}));
	};

	const expandAll = () => {
		const allExpanded = Object.keys(expandedSections).reduce(
			(acc, key) => {
				acc[key] = true;
				return acc;
			},
			{} as Record<string, boolean>,
		);
		setExpandedSections(allExpanded);
	};

	const collapseAll = () => {
		const allCollapsed = Object.keys(expandedSections).reduce(
			(acc, key) => {
				acc[key] = false;
				return acc;
			},
			{} as Record<string, boolean>,
		);
		setExpandedSections(allCollapsed);
	};

	// Group students by mainProduct
	// We group the *paginated* students to respect the current architecture's performance limits.
	// If we wanted to group *all* students, we would use `students` instead of `paginatedStudents`,
	// but that would require disabling pagination for the grid view or implementing client-side pagination per group.
	const groupedStudents = React.useMemo(() => {
		const groups: Record<string, typeof paginatedStudents> = {};

		// Initialize groups to ensure order or existence if needed,
		// but dynamic is safer for now.

		paginatedStudents.forEach((student) => {
			const prod = (student as { mainProduct?: string }).mainProduct ?? 'sem_produto';
			if (!groups[prod]) groups[prod] = [];
			groups[prod].push(student);
		});

		return groups;
	}, [paginatedStudents]);

	return {
		search,
		status,
		churnRisk,
		product,
		view,
		page,
		students,
		paginatedStudents,
		groupedStudents,
		expandedSections,
		totalStudents,
		activeStudents,
		highRiskStudents,
		totalPages,
		PAGE_SIZE,
		clearFilters,
		handleFilterChange,
		navigateToStudent,
		toggleSection,
		expandAll,
		collapseAll,
		navigate,
	};
}
