import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function RevenueChart() {
	const now = new Date();
	const summary = useQuery(api.asaas.queries.getMonthlyFinancialSummary, {
		month: now.getMonth(),
		year: now.getFullYear(),
	});

	if (!summary) {
		return <div>Carregando gráfico...</div>;
	}

	const chartData = [
		{
			month: 'Atual',
			received: summary.paidThisMonth,
			projected: summary.pendingThisMonth,
		},
		...summary.futureProjection.map((m: { month: string; amount: number }) => ({
			month: m.month,
			received: 0,
			projected: m.amount,
		})),
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Receita: Recebido vs Projetado</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer height={300} minWidth={0} width="100%">
					<LineChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="month" />
						<YAxis />
						<Tooltip
							formatter={(value: number | string | undefined) =>
								typeof value === 'number' ? formatCurrency(value) : value
							}
						/>
						<Line dataKey="received" name="Recebido" stroke="#10b981" type="monotone" />
						<Line
							dataKey="projected"
							name="Projetado"
							stroke="#3b82f6"
							strokeDasharray="5 5"
							type="monotone"
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
