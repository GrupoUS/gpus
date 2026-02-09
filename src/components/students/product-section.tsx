'use client';

import { ProductEmptyState } from '@/components/students/product-empty-state';
import { ProductHeader } from '@/components/students/product-header';
import { StudentCard } from '@/components/students/student-card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { StudentListItem } from '@/types/api';

interface ProductSectionProps {
	productId: string;
	count: number;
	totalCount?: number;
	isExpanded: boolean;
	onToggle: () => void;
	students: StudentListItem[];
	onStudentClick: (id: number) => void;
	searchTerm?: string;
	className?: string;
}

export function ProductSection({
	productId,
	count,
	totalCount,
	isExpanded,
	onToggle,
	students,
	onStudentClick,
	searchTerm,
	className,
}: ProductSectionProps) {
	// Always render the section - empty sections show ProductEmptyState
	// This ensures users can see all product categories even when empty

	return (
		<Collapsible
			className={cn(
				'overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200',
				isExpanded ? 'mb-6' : 'mb-2',
				className,
			)}
			onOpenChange={onToggle}
			open={isExpanded}
		>
			<ProductHeader
				count={count}
				isExpanded={isExpanded}
				productId={productId}
				totalCount={totalCount}
			/>

			<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
				<div className="border-t bg-muted/5 p-4 pt-0">
					{students.length > 0 ? (
						<div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
							{students.map((student) => (
								<StudentCard
									key={student.id}
									onClick={() => onStudentClick(student.id)}
									searchTerm={searchTerm}
									student={student}
								/>
							))}
						</div>
					) : (
						<div className="pt-4">
							<ProductEmptyState />
						</div>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
