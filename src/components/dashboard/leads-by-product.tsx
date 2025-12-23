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
	return (
		<Card className="glass-card">
			<CardHeader>
				<CardTitle className="font-display text-2xl font-semibold">Leads por Produto</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{data === undefined ? (
						// Loading state with skeletons
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
					) : Object.keys(data).length === 0 ? (
						// Empty state
						<p className="text-sm text-muted-foreground text-center py-4">
							Nenhum lead registrado no período
						</p>
					) : (
						// Data loaded - render products
						Object.entries(data)
							.sort(([, a], [, b]) => b - a)
							.map(([product, value]) => {
								const allValues = Object.values(data);
								const maxValue = Math.max(...allValues, 1);
								return (
									<div key={product} className="space-y-1">
										<div className="flex justify-between text-sm font-sans">
											<span>{productLabels[product] || product}</span>
											<span className="font-medium font-display tabular-nums">{value}</span>
										</div>
										<div className="h-2 rounded-full bg-muted overflow-hidden">
											<div
												className="h-full rounded-full progress-bar"
												style={{
													width: `${(value / maxValue) * 100}%`,
													background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-3)))`,
												}}
											/>
										</div>
									</div>
								);
							})
					)}
				</div>
			</CardContent>
		</Card>
	);
}
