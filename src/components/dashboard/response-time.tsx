import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ResponseTimeProps {
	avgResponseTime?: number;
	trend?: number;
}

export function ResponseTime({ avgResponseTime, trend }: ResponseTimeProps) {
	return (
		<Card className="glass-card">
			<CardHeader>
				<CardTitle className="font-display text-2xl font-semibold">Tempo de Resposta</CardTitle>
			</CardHeader>
			<CardContent>
				{avgResponseTime === undefined ? (
					<Skeleton className="h-32 w-full" />
				) : (
					<div className="space-y-4">
						<div className="text-center">
							<div className="font-display text-4xl font-bold tabular-nums">
								{avgResponseTime || 0}min
							</div>
							<p className="text-sm text-muted-foreground mt-2">Tempo médio de resposta</p>
							{trend !== undefined && trend !== 0 && (
								<div className="flex items-center justify-center gap-2 mt-2">
									<span
										className={cn(
											'text-xs font-medium',
											trend > 0 ? 'text-red-500' : 'text-green-500',
										)}
									>
										{trend > 0 ? '+' : ''}
										{trend}%
									</span>
									<span className="text-xs text-muted-foreground">vs. período anterior</span>
								</div>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
