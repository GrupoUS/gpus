import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
	title: string;
	value: string | number;
	description?: string;
	icon: LucideIcon;
	trend?: {
		value: number;
		isPositive: boolean;
	};
	className?: string;
}

export function StatsCard({
	title,
	value,
	description,
	icon: Icon,
	trend,
	className,
}: StatsCardProps) {
	return (
		<Card className={cn('stats-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_hsl(var(--primary)/0.3)]', className)}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground stats-card-icon transition-transform duration-300 ease-out hover:scale-110 hover:rotate-6" />
			</CardHeader>
			<CardContent>
				<div className="font-display text-3xl font-bold tabular-nums">{value}</div>
				<div className="flex items-center gap-2 mt-1">
					{trend && (
						<span
							className={cn(
								'flex items-center text-xs font-medium',
								trend.isPositive ? 'text-green-500' : 'text-red-500',
							)}
						>
							{trend.isPositive ? (
								<TrendingUp className="h-3 w-3 mr-1" />
							) : (
								<TrendingDown className="h-3 w-3 mr-1" />
							)}
							{trend.value}%
						</span>
					)}
					{description && <p className="text-xs text-muted-foreground">{description}</p>}
				</div>
			</CardContent>
		</Card>
	);
}
