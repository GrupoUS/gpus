import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
					{data
						? Object.entries(data)
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
														background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--us-purple-light)))`,
													}}
												/>
											</div>
										</div>
									);
								})
						: [
								{ name: 'TRINTAE3', value: 45 },
								{ name: 'Black NEON', value: 28 },
								{ name: 'Comunidade US', value: 32 },
							].map((item) => (
								<div key={item.name} className="space-y-1">
									<div className="flex justify-between text-sm font-sans">
										<span>{item.name}</span>
										<span className="font-medium font-display tabular-nums">{item.value}</span>
									</div>
									<div className="h-2 rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full progress-bar"
											style={{
												width: `${(item.value / 50) * 100}%`,
												background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--us-purple-light)))`,
											}}
										/>
									</div>
								</div>
							))}
				</div>
			</CardContent>
		</Card>
	);
}
