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
				<CardTitle className="font-display font-semibold text-2xl">Tempo de Resposta</CardTitle>
			</CardHeader>
			<CardContent>
				{avgResponseTime === undefined ? (
					<Skeleton className="h-32 w-full" />
				) : (
					<div className="space-y-4">
						<div className="text-center">
							<div className="font-bold font-display text-4xl tabular-nums">
								{avgResponseTime || 0}min
							</div>
							<p className="mt-2 text-muted-foreground text-sm">Tempo médio de resposta</p>
							{trend !== undefined && trend !== 0 && (
								<div className="mt-2 flex items-center justify-center gap-2">
									<span
										className={cn(
											'font-medium text-xs',
											trend > 0 ? 'text-red-500' : 'text-green-500',
										)}
									>
										{trend > 0 ? '+' : ''}
										{trend}%
									</span>
									<span className="text-muted-foreground text-xs">vs. período anterior</span>
								</div>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
