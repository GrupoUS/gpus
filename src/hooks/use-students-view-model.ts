import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from '@tanstack/react-router';
import React, { useEffect } from 'react';

import { trpc } from '../lib/trpc';

const PAGE_SIZE = 12;

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useStudentsViewModel<RouteType extends { useSearch: () => any }>(Route: RouteType) {
	const navigate = useNavigate();
	const { search, status, churnRisk, product, view, page } = Route.useSearch();
	const { isSignedIn } = useAuth();

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
					studentId: undefined,
				},
			});
		}
	}, [navigate]);

	// Use list query for table view and stats (paginated)
	const { data: studentsResult } = trpc.students.list.useQuery(
		{
			search: search || undefined,
			status: status === 'all' ? undefined : status,
		},
		{ enabled: !!isSignedIn },
	);

	const students = studentsResult?.data ?? [];

	// TODO: Add groupedByProduct query to students router for grid view
	// For now, we'll compute groups client-side from the list data
	const groupedStudentsData = React.useMemo(() => {
		if (!students.length) return undefined;

		// Group students by their products (simplified from server-side grouping)
		const productMap = new Map<string, typeof students>();

		for (const student of students) {
			const productKey = 'sem_produto'; // Default - actual grouping needs enrollment data
			if (!productMap.has(productKey)) {
				productMap.set(productKey, []);
			}
			productMap.get(productKey)?.push(student);
		}

		return Array.from(productMap.entries()).map(([id, studentList]) => ({
			id,
			students: studentList,
			count: studentList.length,
		}));
	}, [students]);

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
				studentId: undefined,
			},
		});
	};

	// Stats
	const totalStudents = students.length;
	const activeStudents = students.filter((s) => s.status === 'ativo').length;
	const highRiskStudents = students.filter((s) => s.churnRisk === 'alto').length;

	// Pagination logic - only for table view
	const totalPages = Math.ceil(totalStudents / PAGE_SIZE);
	const paginatedStudents = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	// Reset page when filters change
	const handleFilterChange = (key: string, value: string) => {
		void navigate({
			to: '/students',
			search: {
				...{ search, status, churnRisk, product, view, page, studentId: undefined },
				[key]: value,
				page: 1,
			},
		});
	};

	const navigateToStudent = (studentId: number) => {
		void navigate({
			to: '/students/$studentId',
			params: { studentId: String(studentId) },
			search: {
				page,
				search,
				status,
				churnRisk,
				product,
				view,
				studentId: undefined,
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

	// Transform grouped data into the format expected by the UI
	const groupedStudents = React.useMemo(() => {
		if (!groupedStudentsData) return {};

		const groups: Record<string, typeof students> = {};

		for (const group of groupedStudentsData) {
			groups[group.id] = group.students;
		}

		return groups;
	}, [groupedStudentsData]);

	// Get the ordered list of product keys from groupedStudentsData
	const productKeys = React.useMemo(() => {
		if (!groupedStudentsData) return [];
		return groupedStudentsData.map((g) => g.id);
	}, [groupedStudentsData]);

	// Check if any students exist across all groups
	const hasAnyStudentsInGroups = React.useMemo(() => {
		if (!groupedStudentsData) return false;
		return groupedStudentsData.some((g) => g.count > 0);
	}, [groupedStudentsData]);

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
		groupedStudentsData,
		productKeys,
		hasAnyStudentsInGroups,
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
