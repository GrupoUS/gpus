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
		<Card
			className={cn(
				'stats-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_hsl(var(--primary)/0.3)]',
				className,
			)}
			variant="glass"
		>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-muted-foreground text-sm">{title}</CardTitle>
				<Icon className="stats-card-icon h-4 w-4 text-muted-foreground transition-transform duration-300 ease-out hover:rotate-6 hover:scale-110" />
			</CardHeader>
			<CardContent>
				<div className="font-bold font-display text-3xl tabular-nums">{value}</div>
				{/* Sparkline placeholder - can be enhanced with actual data */}
				<svg
					aria-label="Sparkline chart"
					className="mt-2 h-8 w-full opacity-30"
					preserveAspectRatio="none"
					viewBox="0 0 100 20"
				>
					<title>Sparkline chart</title>
					<polyline
						className="sparkline-path"
						fill="none"
						points="0,15 20,12 40,8 60,10 80,5 100,8"
						stroke="hsl(var(--primary))"
						strokeWidth="1.5"
						style={{
							strokeDasharray: 120,
							strokeDashoffset: 120,
							animation: 'sparkline-draw 1s ease-out forwards',
						}}
						vectorEffect="non-scaling-stroke"
					/>
				</svg>
				<div className="mt-1 flex items-center gap-2">
					{trend && (
						<span
							className={cn(
								'flex items-center font-medium text-xs',
								trend.isPositive ? 'text-green-500' : 'text-red-500',
							)}
						>
							{trend.isPositive ? (
								<TrendingUp className="mr-1 h-3 w-3" />
							) : (
								<TrendingDown className="mr-1 h-3 w-3" />
							)}
							{trend.value}%
						</span>
					)}
					{description && <p className="text-muted-foreground text-xs">{description}</p>}
				</div>
			</CardContent>
		</Card>
	);
}
