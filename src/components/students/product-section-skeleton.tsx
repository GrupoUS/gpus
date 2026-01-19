'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ProductSectionSkeleton() {
	return (
		<div className="mb-4 overflow-hidden rounded-lg border bg-card shadow-sm">
			{/* Header Skeleton */}
			<div className="flex h-16 items-center justify-between border-b p-4">
				<div className="flex items-center gap-3">
					<Skeleton className="h-8 w-1 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
				<Skeleton className="h-5 w-5 rounded-full" />
			</div>

			{/* Content Skeleton */}
			<div className="bg-muted/5 p-4">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div className="space-y-3 rounded-lg border bg-card p-4" key={i}>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Skeleton className="h-10 w-10 rounded-full" />
									<div className="space-y-1">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-3 w-16" />
									</div>
								</div>
								<Skeleton className="h-5 w-16 rounded-full" />
							</div>
							<div className="space-y-2 pt-2">
								<Skeleton className="h-3 w-full" />
								<Skeleton className="h-3 w-2/3" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
