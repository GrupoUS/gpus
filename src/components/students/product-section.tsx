'use client';

import type { Doc, Id } from '@convex/_generated/dataModel';

import { ProductEmptyState } from '@/components/students/product-empty-state';
import { ProductHeader } from '@/components/students/product-header';
import { StudentCard } from '@/components/students/student-card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ProductSectionProps {
	productId: string;
	count: number;
	totalCount?: number;
	isExpanded: boolean;
	onToggle: () => void;
	students: Doc<'students'>[];
	onStudentClick: (id: Id<'students'>) => void;
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
			open={isExpanded}
			onOpenChange={onToggle}
			className={cn(
				'border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-200',
				isExpanded ? 'mb-6' : 'mb-2',
				className,
			)}
		>
			<ProductHeader
				productId={productId}
				count={count}
				totalCount={totalCount}
				isExpanded={isExpanded}
				onToggle={onToggle}
			/>

			<CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
				<div className="p-4 pt-0 border-t bg-muted/5">
					{students.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
							{students.map((student) => (
								<StudentCard
									key={student._id}
									student={student}
									onClick={() => onStudentClick(student._id)}
									searchTerm={searchTerm}
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
