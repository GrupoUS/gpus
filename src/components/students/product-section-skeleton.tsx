'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ProductSectionSkeleton() {
	return (
		<div className="border rounded-lg bg-card shadow-sm mb-4 overflow-hidden">
			{/* Header Skeleton */}
			<div className="flex items-center justify-between p-4 h-16 border-b">
				<div className="flex items-center gap-3">
					<Skeleton className="w-1 h-8 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
				<Skeleton className="h-5 w-5 rounded-full" />
			</div>

			{/* Content Skeleton */}
			<div className="p-4 bg-muted/5">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="border rounded-lg p-4 space-y-3 bg-card">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Skeleton className="w-10 h-10 rounded-full" />
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
