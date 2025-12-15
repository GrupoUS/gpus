import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const funnelStages = [
	{ id: 'novo', label: 'Novos', color: 'bg-blue-500' },
	{ id: 'primeiro_contato', label: 'Primeiro Contato', color: 'bg-cyan-500' },
	{ id: 'qualificado', label: 'Qualificados', color: 'bg-purple-500' },
	{ id: 'proposta', label: 'Proposta', color: 'bg-amber-500' },
	{ id: 'negociacao', label: 'Negociação', color: 'bg-pink-500' },
	{ id: 'fechado_ganho', label: 'Fechados', color: 'bg-emerald-500' },
];

interface FunnelChartProps {
	data?: {
		novo: number;
		primeiro_contato: number;
		qualificado: number;
		proposta: number;
		negociacao: number;
		fechado_ganho: number;
	};
}

export function FunnelChart({ data }: FunnelChartProps) {
	return (
		<Card className="glass-card">
			<CardHeader>
				<CardTitle className="font-display text-2xl font-semibold">Funil de Conversão</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{funnelStages.map((stage) => {
					const value = data?.[stage.id as keyof typeof data] || 0;
					const maxValue = data?.novo || 100;
					const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

					return (
						<div key={stage.id} className="space-y-1">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{stage.label}</span>
								<span className="font-medium">{value}</span>
							</div>
							<div className="h-2 rounded-full bg-muted overflow-hidden">
								<div
									className={cn('h-full rounded-full transition-all', stage.color)}
									style={{ width: `${percentage}%` }}
								/>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
