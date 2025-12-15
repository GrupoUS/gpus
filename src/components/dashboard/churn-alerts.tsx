import { AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChurnAlert {
	_id: string;
	studentName: string;
	reason: string;
	risk: string;
}

interface ChurnAlertsProps {
	data?: ChurnAlert[];
}

export function ChurnAlerts({ data }: ChurnAlertsProps) {
	return (
		<Card className="glass-card">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-display text-2xl font-semibold">Alertas de Risco</CardTitle>
				<AlertTriangle className="h-4 w-4 text-amber-500" />
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{!data ? (
						<Skeleton className="h-16 w-full" />
					) : data.length > 0 ? (
						data.map((alert) => (
							<div
								key={alert._id}
								className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10"
							>
								<div>
									<p className="text-sm font-medium">{alert.studentName}</p>
									<p className="text-xs text-muted-foreground">{alert.reason}</p>
								</div>
								<Badge variant="outline" className="text-amber-600 border-amber-600">
									{alert.risk}
								</Badge>
							</div>
						))
					) : (
						<p className="text-sm text-muted-foreground text-center py-4">
							Nenhum alerta no momento 🎉
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
