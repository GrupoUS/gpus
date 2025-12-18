import type { Id } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';

import { ProductSection } from '@/components/students/product-section';
import { ProductSectionSkeleton } from '@/components/students/product-section-skeleton';
import { StudentDetail } from '@/components/students/student-detail';
import { StudentFilters } from '@/components/students/student-filters';
import { StudentHeader } from '@/components/students/student-header';
import { StudentListEmptyState } from '@/components/students/student-list-empty-state';
import { StudentPagination } from '@/components/students/student-pagination';
import { StudentStats } from '@/components/students/student-stats';
import { StudentsTable } from '@/components/students/student-table';
import { useStudentsViewModel } from '@/hooks/use-students-view-model';

export const Route = createFileRoute('/_authenticated/students')({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			search: (search.search as string) || '',
			status: (search.status as string) || 'all',
			churnRisk: (search.churnRisk as string) || 'all',
			product: (search.product as string) || 'all',
			view: ((search.view as string) || 'grid') === 'table' ? 'table' : 'grid',
			page: Math.max(1, Number(search.page) || 1),
			studentId: (search.studentId as Id<'students'>) || undefined,
		};
	},
	component: StudentsPage,
});

function StudentsPage() {
	const {
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
		clearFilters,
		handleFilterChange,
		toggleSection,
		expandAll,
		collapseAll,
		navigate,
		PAGE_SIZE,
	} = useStudentsViewModel(Route);

	const params = Route.useSearch();

	// Check if filters are active
	const isFiltering = search || status !== 'all' || churnRisk !== 'all' || product !== 'all';

	const handlePageChange = (newPage: number) => {
		void navigate({
			to: '/students',
			search: { ...params, page: newPage },
		});
	};

	const handleStudentClick = (studentId: Id<'students'>) => {
		void navigate({
			to: '/students',
			search: { ...params, studentId },
		});
	};

	const handleCloseDetail = () => {
		void navigate({
			to: '/students',
			search: { ...params, studentId: undefined },
		});
	};

	// Determine loading and empty states based on view type
	const isLoadingGrid = view === 'grid' && !groupedStudentsData;
	const isLoadingTable = view === 'table' && !students;
	const isLoading = isLoadingGrid || isLoadingTable;

	// For grid view, check if any students exist in any group
	// For table view, check the students list directly
	const hasAnyStudents = view === 'grid' ? hasAnyStudentsInGroups : students && students.length > 0;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<StudentHeader />

			{/* Stats Cards */}
			<StudentStats
				totalStudents={totalStudents}
				activeStudents={activeStudents}
				highRiskStudents={highRiskStudents}
			/>

			{/* Filters */}
			<StudentFilters
				search={search || ''}
				onSearchChange={(v) => handleFilterChange('search', v)}
				status={status || 'all'}
				onStatusChange={(v) => handleFilterChange('status', v)}
				churnRisk={churnRisk || 'all'}
				onChurnRiskChange={(v) => handleFilterChange('churnRisk', v)}
				product={product || 'all'}
				onProductChange={(v) => handleFilterChange('product', v)}
				onClear={clearFilters}
				onExpandAll={expandAll}
				onCollapseAll={collapseAll}
			/>

			{/* Students List */}
			{isLoading ? (
				<div className="space-y-4">
					{[1, 2].map((i) => (
						<ProductSectionSkeleton key={i} />
					))}
				</div>
			) : !hasAnyStudents && isFiltering ? (
				<StudentListEmptyState isFiltering={true} search={search} />
			) : view === 'table' ? (
				/* Table View */
				<StudentsTable students={paginatedStudents} onStudentClick={handleStudentClick} />
			) : (
				/* Grid View (Product Sections) - ALL products rendered, including empty ones */
				<div className="space-y-2">
					{productKeys.map((productId: string) => {
						const groupStudents = groupedStudents[productId] ?? [];

						// Always render product sections - empty sections show ProductEmptyState
						return (
							<ProductSection
								key={productId}
								productId={productId}
								count={groupStudents.length}
								isExpanded={!!expandedSections[productId]}
								onToggle={() => toggleSection(productId)}
								students={groupStudents}
								onStudentClick={handleStudentClick}
								searchTerm={search}
							/>
						);
					})}
				</div>
			)}

			{/* Pagination - Only show in Table view */}
			{view === 'table' && students && students.length > PAGE_SIZE && (
				<StudentPagination
					page={page}
					totalPages={totalPages}
					totalStudents={totalStudents}
					pageSize={PAGE_SIZE}
					onPageChange={handlePageChange}
				/>
			)}

			<StudentDetail studentId={params.studentId ?? null} onClose={handleCloseDetail} />
		</div>
	);
}
