import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const productLabels: Record<string, string> = {
	trintae3: 'TRINTAE3',
	black_neon: 'Black NEON',
	comunidade: 'Comunidade US',
	otb: 'OTB MBA',
	auriculo: 'Aurículo',
	na_mesa_certa: 'Na Mesa Certa',
	indefinido: 'Indefinido',
};

interface LeadsByProductProps {
	data?: Record<string, number>;
}

export function LeadsByProduct({ data }: LeadsByProductProps) {
	let content: ReactNode = null;

	if (data === undefined) {
		content = (
			<>
				<div className="space-y-1">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-2 w-full rounded-full" />
				</div>
				<div className="space-y-1">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-2 w-3/4 rounded-full" />
				</div>
				<div className="space-y-1">
					<Skeleton className="h-4 w-36" />
					<Skeleton className="h-2 w-2/3 rounded-full" />
				</div>
			</>
		);
	} else if (Object.keys(data).length === 0) {
		content = (
			<p className="py-4 text-center text-muted-foreground text-sm">
				Nenhum lead registrado no período
			</p>
		);
	} else {
		content = Object.entries(data)
			.sort(([, a], [, b]) => b - a)
			.map(([product, value]) => {
				const allValues = Object.values(data);
				const maxValue = Math.max(...allValues, 1);
				return (
					<div className="space-y-1" key={product}>
						<div className="flex justify-between font-sans text-sm">
							<span>{productLabels[product] || product}</span>
							<span className="font-display font-medium tabular-nums">{value}</span>
						</div>
						<div className="h-2 overflow-hidden rounded-full bg-muted">
							<div
								className="progress-bar h-full rounded-full"
								style={{
									width: `${(value / maxValue) * 100}%`,
									background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-3)))',
								}}
							/>
						</div>
					</div>
				);
			});
	}

	return (
		<Card className="glass-card">
			<CardHeader>
				<CardTitle className="font-display font-semibold text-2xl">Leads por Produto</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">{content}</div>
			</CardContent>
		</Card>
	);
}
