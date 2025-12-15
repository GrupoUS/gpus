'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { CreditCard } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, productLabels } from '@/lib/constants';

interface StudentPaymentsTabProps {
	studentId: Id<'students'>;
}

// Calculate due date based on start date and installment number
function calculateDueDate(startDate: number, installmentNumber: number): Date {
	const date = new Date(startDate);
	date.setMonth(date.getMonth() + installmentNumber - 1);
	return date;
}

export function StudentPaymentsTab({ studentId }: StudentPaymentsTabProps) {
	const enrollments = useQuery(api.enrollments.getByStudent, { studentId });

	if (!enrollments) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-32" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={i} className="flex items-center space-x-4">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-6 w-20" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	// Build payment history from enrollments
	const paymentHistory =
		enrollments.flatMap((enrollment: Doc<'enrollments'>) => {
			const payments = [];
			const paidInstallments = enrollment.paidInstallments ?? 0;

			for (let i = 1; i <= enrollment.installments; i++) {
				const isPaid = i <= paidInstallments;
				const isOverdue = !isPaid && enrollment.paymentStatus === 'atrasado';

				payments.push({
					enrollmentId: enrollment._id,
					product: enrollment.product,
					installmentNumber: i,
					totalInstallments: enrollment.installments,
					value: enrollment.installmentValue ?? 0,
					dueDate: calculateDueDate(enrollment.startDate ?? Date.now(), i),
					status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
				});
			}
			return payments;
		}) ?? [];

	// Sort payments by due date
	paymentHistory.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

	if (paymentHistory.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				<CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
				<p>Nenhum pagamento registrado</p>
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CreditCard className="h-5 w-5" />
					Histórico de Pagamentos
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Produto</TableHead>
							<TableHead>Parcela</TableHead>
							<TableHead>Valor</TableHead>
							<TableHead>Vencimento</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paymentHistory.map((payment) => (
							<TableRow key={`${payment.enrollmentId}-${payment.installmentNumber}`}>
								<TableCell className="font-medium">
									{productLabels[payment.product] || payment.product}
								</TableCell>
								<TableCell>
									{payment.installmentNumber}/{payment.totalInstallments}
								</TableCell>
								<TableCell>{formatCurrency(payment.value)}</TableCell>
								<TableCell>{format(payment.dueDate, 'dd/MM/yyyy')}</TableCell>
								<TableCell>
									<Badge
										variant={
											payment.status === 'paid'
												? 'default'
												: payment.status === 'overdue'
													? 'destructive'
													: 'secondary'
										}
									>
										{payment.status === 'paid'
											? 'Pago'
											: payment.status === 'overdue'
												? 'Atrasado'
												: 'Pendente'}
									</Badge>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
