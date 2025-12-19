import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function PaymentCalendar() {
	const now = new Date();
	const [month] = useState(now.getMonth());
	const [year] = useState(now.getFullYear());

	const dueDates = useQuery(api.asaas.getPaymentsDueDates, { month, year });

	if (!dueDates) {
		return <div>Carregando calendário...</div>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Calendário de Pagamentos</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{dueDates.map((dateGroup) => (
						<div
							key={dateGroup.date}
							className="flex items-center justify-between rounded border p-2"
						>
							<div>
								<p className="font-medium">
									{new Date(dateGroup.date).toLocaleDateString('pt-BR')}
								</p>
								<p className="text-sm text-muted-foreground">
									{dateGroup.payments.length} cobranças
								</p>
							</div>
							<div className="text-right">
								<p className="text-sm text-green-600">
									Pago: {formatCurrency(dateGroup.totals.paid)}
								</p>
								<p className="text-sm text-yellow-600">
									Pendente: {formatCurrency(dateGroup.totals.pending)}
								</p>
								{dateGroup.totals.overdue > 0 && (
									<p className="text-sm text-red-600">
										Vencido: {formatCurrency(dateGroup.totals.overdue)}
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
