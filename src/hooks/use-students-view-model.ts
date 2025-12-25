import { api } from '@convex/_generated/api';
import { useNavigate } from '@tanstack/react-router';
import { useConvexAuth, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import React, { useEffect } from 'react';

import type { Id } from '../../convex/_generated/dataModel';

const PAGE_SIZE = 12;

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useStudentsViewModel<RouteType extends { useSearch: () => any }>(Route: RouteType) {
	const navigate = useNavigate();
	const { search, status, churnRisk, product, view, page } = Route.useSearch();
	const { isAuthenticated } = useConvexAuth();

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
	const students = useQuery(
		api.students.list,
		isAuthenticated
			? {
					search: search || undefined,
					status: status === 'all' ? undefined : status,
					churnRisk: churnRisk === 'all' ? undefined : churnRisk,
					product: product === 'all' ? undefined : product,
				}
			: 'skip',
	) as FunctionReturnType<typeof api.students.list> | undefined;

	// Use grouped query for grid view (ALL students, grouped by ALL enrollments)
	const groupedStudentsData = useQuery(
		api.students.getStudentsGroupedByProducts,
		isAuthenticated ? {} : 'skip',
	) as FunctionReturnType<typeof api.students.getStudentsGroupedByProducts> | undefined;

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

	// Define student type for type safety
	type StudentType = NonNullable<typeof students>[number];

	// Stats - from the list query for accuracy
	const totalStudents = students?.length ?? 0;
	const activeStudents =
		students?.filter(
			(s: StudentType | null): s is StudentType => s !== null && s.status === 'ativo',
		).length ?? 0;
	const highRiskStudents =
		students?.filter(
			(s: StudentType | null): s is StudentType => s !== null && s.churnRisk === 'alto',
		).length ?? 0;

	// Pagination logic - only for table view
	const totalPages = Math.ceil(totalStudents / PAGE_SIZE);
	const paginatedStudents = (
		students?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? []
	).filter((s: StudentType | null): s is StudentType => s !== null);

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

	const navigateToStudent = (studentIdParam: Id<'students'>) => {
		void navigate({
			to: '/students/$studentId',
			params: { studentId: studentIdParam },
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

	// Transform grouped data from Convex into the format expected by the UI
	// This uses the getStudentsGroupedByProducts query which:
	// - Groups students by ALL their enrollments (student appears in each product)
	// - Includes ALL products (even empty ones)
	// - Applies filters server-side before grouping
	const groupedStudents = React.useMemo(() => {
		if (!groupedStudentsData) return {};

		const groups: Record<string, NonNullable<typeof students>> = {};

		for (const group of groupedStudentsData) {
			// Map students to the expected format (with mainProduct for compatibility)
			groups[group.id] = group.students.map((student: (typeof group.students)[number]) => ({
				_id: student._id,
				_creationTime: student._creationTime,
				name: student.name,
				email: student.email,
				phone: student.phone,
				profession: student.profession,
				hasClinic: student.hasClinic,
				clinicName: student.clinicName,
				clinicCity: student.clinicCity,
				status: student.status,
				assignedCS: student.assignedCS,
				churnRisk: student.churnRisk,
				lastEngagementAt: student.lastEngagementAt,
				leadId: student.leadId,
				createdAt: student.createdAt,
				updatedAt: student.updatedAt,
				mainProduct: group.id === 'sem_produto' ? undefined : group.id,
			}));
		}

		return groups;
	}, [groupedStudentsData]);

	// Get the ordered list of product keys from groupedStudentsData
	const productKeys = React.useMemo(() => {
		if (!groupedStudentsData) return [];
		return groupedStudentsData.map((g: { id: string }) => g.id);
	}, [groupedStudentsData]);

	// Check if any students exist across all groups
	const hasAnyStudentsInGroups = React.useMemo(() => {
		if (!groupedStudentsData) return false;
		return groupedStudentsData.some((g: { count: number }) => g.count > 0);
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
