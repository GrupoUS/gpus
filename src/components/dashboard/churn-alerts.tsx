import type { Id } from '@convex/_generated/dataModel';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChurnAlert {
	_id: Id<'students'>;
	studentName: string;
	reason: string;
	risk: 'alto' | 'medio';
}

interface ChurnAlertsProps {
	data?: ChurnAlert[];
}

export function ChurnAlerts({ data }: ChurnAlertsProps) {
	let content: ReactNode = null;

	if (!data) {
		content = <Skeleton className="h-16 w-full" />;
	} else if (data.length === 0) {
		content = (
			<p className="py-4 text-center text-muted-foreground text-sm">Nenhum alerta no momento 🎉</p>
		);
	} else {
		content = data.map((alert) => (
			<div
				className="flex items-center justify-between rounded-lg bg-amber-500/10 p-2"
				key={alert._id}
			>
				<div>
					<p className="font-medium text-sm">{alert.studentName}</p>
					<p className="text-muted-foreground text-xs">{alert.reason}</p>
				</div>
				<Badge className="border-amber-600 text-amber-600" variant="outline">
					{alert.risk}
				</Badge>
			</div>
		));
	}

	return (
		<Card className="glass-card">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-display font-semibold text-2xl">Alertas de Risco</CardTitle>
				<AlertTriangle className="h-4 w-4 text-amber-500" />
			</CardHeader>
			<CardContent>
				<div className="space-y-3">{content}</div>
			</CardContent>
		</Card>
	);
}
