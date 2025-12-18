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

	// Grouping Logic for Product-Centric View
	// We use a local state for expansion to avoid URL clutter,
	// or we could sync it with URL if persistence is needed.
	// For now, local state is simpler and standard for accordions.
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
	// Note: 'students' here is the flat list from the query.
	// We should probably group the *paginated* students if we want pagination to work per page,
	// OR group *all* students and handle pagination differently.
	// Given the "Product-Centric Dashboard" usually implies seeing all relevant students grouped,
	// but we have a PAGE_SIZE.
	// If we group the *paginated* result, we might get fragmented groups across pages.
	// Ideally, for a dashboard like this, we might want infinite scroll or per-group pagination.
	// However, adhering to the current constraints: we will group the *current page's* students
	// OR (better) group the *filtered* students and maybe disable global pagination for this view
	// if the list isn't huge, or just accept that pagination cuts across groups.
	// Let's group the `paginatedStudents` to respect the current architecture's performance limits.

	const groupedStudents = React.useMemo(() => {
		const groups: Record<string, typeof paginatedStudents> = {};

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
