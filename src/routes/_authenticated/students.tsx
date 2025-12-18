import { createFileRoute } from '@tanstack/react-router';

import { ProductSection } from '@/components/students/product-section';
import { ProductSectionSkeleton } from '@/components/students/product-section-skeleton';
import { StudentFilters } from '@/components/students/student-filters';
import { StudentHeader } from '@/components/students/student-header';
import { StudentListEmptyState } from '@/components/students/student-list-empty-state';
import { StudentPagination } from '@/components/students/student-pagination';
import { StudentStats } from '@/components/students/student-stats';
import { StudentsTable } from '@/components/students/student-table';
import { useStudentsViewModel } from '@/hooks/use-students-view-model';
import { productLabels } from '@/lib/constants';

export const Route = createFileRoute('/_authenticated/students')({
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
		expandedSections,
		totalStudents,
		activeStudents,
		highRiskStudents,
		totalPages,
		clearFilters,
		handleFilterChange,
		navigateToStudent,
		toggleSection,
		expandAll,
		collapseAll,
		navigate,
		PAGE_SIZE,
	} = useStudentsViewModel(Route);

	const productKeys = [...Object.keys(productLabels), 'sem_produto'];

	// Check if any students exist across all groups when in grid view
	const hasAnyStudents = students && students.length > 0;
	const isFiltering = search || status !== 'all' || churnRisk !== 'all' || product !== 'all';

	const handlePageChange = (newPage: number) => {
		void navigate({
			to: '/students',
			search: { ...{ search, status, churnRisk, product, view }, page: newPage },
		});
	};

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
			{!students ? (
				<div className="space-y-4">
					{[1, 2].map((i) => (
						<ProductSectionSkeleton key={i} />
					))}
				</div>
			) : !hasAnyStudents ? (
				<StudentListEmptyState isFiltering={!!isFiltering} search={search} />
			) : view === 'table' ? (
				/* Table View */
				<StudentsTable students={paginatedStudents} onStudentClick={navigateToStudent} />
			) : (
				/* Grid View (Product Sections) */
				<div className="space-y-2">
					{productKeys.map((productId) => {
						const groupStudents = groupedStudents[productId];
						// Only skip rendering if group is empty AND we are filtering by product
						// Otherwise we want to show empty sections if they exist in the system (optional design choice,
						// but here we follow the logic: if no students in group, don't show section unless we want to show empty states for all products)
						// Current logic: hide empty sections to reduce clutter
						if (!groupStudents || groupStudents.length === 0) return null;

						return (
							<ProductSection
								key={productId}
								productId={productId}
								count={groupStudents.length}
								isExpanded={!!expandedSections[productId]}
								onToggle={() => toggleSection(productId)}
								students={groupStudents}
								onStudentClick={navigateToStudent}
								searchTerm={search}
							/>
						);
					})}
				</div>
			)}

			{/* Pagination - Only show in Table view or if we implement pagination for Grid view (currently Grid shows all by group) */}
			{view === 'table' && students && students.length > PAGE_SIZE && (
				<StudentPagination
					page={page}
					totalPages={totalPages}
					totalStudents={totalStudents}
					pageSize={PAGE_SIZE}
					onPageChange={handlePageChange}
				/>
			)}
		</div>
	);
}
