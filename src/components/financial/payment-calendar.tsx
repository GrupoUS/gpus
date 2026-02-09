import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { trpc } from '../../lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { FinancialMetrics } from '@/types/api';

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const STATUS_CONFIG = {
	PENDING: { label: 'Pendente', color: 'bg-yellow-500' },
	RECEIVED: { label: 'Recebido', color: 'bg-green-500' },
	CONFIRMED: { label: 'Confirmado', color: 'bg-green-500' },
	RECEIVED_IN_CASH: { label: 'Recebido em Dinheiro', color: 'bg-green-500' },
	OVERDUE: { label: 'Vencido', color: 'bg-red-500' },
	REFUNDED: { label: 'Reembolsado', color: 'bg-purple-500' },
	CANCELLED: { label: 'Cancelado', color: 'bg-gray-500' },
};

interface PaymentDateGroup {
	date: string;
	payments: FinancialMetrics[];
	totals: { pending: number; paid: number; overdue: number };
}

export function PaymentCalendar() {
	const now = new Date();
	const [month, setMonth] = useState(now.getMonth());
	const [year, setYear] = useState(now.getFullYear());
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const { data: dueDates } = trpc.financial.metrics.useQuery({
		month,
		year,
	});

	// Create a map of date -> payment data for quick lookup
	const datePaymentMap = useMemo(() => {
		if (!dueDates) return new Map<string, PaymentDateGroup>();
		const map = new Map<string, PaymentDateGroup>();
		// @ts-expect-error - Migration: error TS2488
		for (const group of dueDates) {
			map.set(group.date, group);
		}
		return map;
	}, [dueDates]);

	// Get dates with payments for styling
	const datesWithPayments = useMemo(() => {
		return new Set(datePaymentMap.keys());
	}, [datePaymentMap]);

	// Get selected day's payments
	const selectedPayments = selectedDate ? datePaymentMap.get(selectedDate) : null;

	// Calculate displayed month date for the calendar
	const displayedMonth = new Date(year, month, 1);

	// Navigate months
	const goToPreviousMonth = () => {
		if (month === 0) {
			setMonth(11);
			setYear((y) => y - 1);
		} else {
			setMonth((m) => m - 1);
		}
	};

	const goToNextMonth = () => {
		if (month === 11) {
			setMonth(0);
			setYear((y) => y + 1);
		} else {
			setMonth((m) => m + 1);
		}
	};

	// Handle day click
	const handleDayClick = (date: Date) => {
		const dateKey = date.toISOString().split('T')[0];
		if (datePaymentMap.has(dateKey)) {
			setSelectedDate(dateKey);
			setIsSheetOpen(true);
		}
	};

	// Custom day content renderer for colored dots
	const renderDayContent = (date: Date) => {
		const dateKey = date.toISOString().split('T')[0];
		const group = datePaymentMap.get(dateKey);

		if (!group) return null;

		const hasOverdue = group.totals.overdue > 0;
		const hasPending = group.totals.pending > 0;
		const hasPaid = group.totals.paid > 0;

		return (
			<div className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
				{hasPaid && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
				{hasPending && <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />}
				{hasOverdue && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
			</div>
		);
	};

	// Loading state
	if (dueDates === undefined) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Calendário de Pagamentos</CardTitle>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-75 w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle>Calendário de Pagamentos</CardTitle>
					<div className="flex items-center gap-2">
						<Button onClick={goToPreviousMonth} size="icon" variant="outline">
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="min-w-35 text-center font-medium">
							{displayedMonth.toLocaleDateString('pt-BR', {
								month: 'long',
								year: 'numeric',
							})}
						</span>
						<Button onClick={goToNextMonth} size="icon" variant="outline">
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<Calendar
						className="rounded-md border p-3"
						components={{
							DayButton: ({ day, modifiers }) => {
								const dateKey = day.date.toISOString().split('T')[0];
								const hasPayments = datesWithPayments.has(dateKey);

								return (
									<button
										className={`relative flex h-9 w-9 flex-col items-center justify-center rounded-md text-sm ${
											hasPayments
												? 'cursor-pointer font-semibold hover:bg-accent'
												: 'cursor-default'
										} ${modifiers.today ? 'bg-accent' : ''} ${modifiers.outside ? 'text-muted-foreground opacity-50' : ''}`}
										onClick={(e) => {
											e.preventDefault();
											if (hasPayments) {
												handleDayClick(day.date);
											}
										}}
										type="button"
									>
										{day.date.getDate()}
										{renderDayContent(day.date)}
									</button>
								);
							},
						}}
						mode="single"
						modifiers={{
							hasPayments: (date) => datesWithPayments.has(date.toISOString().split('T')[0]),
						}}
						modifiersClassNames={{
							hasPayments: 'relative cursor-pointer hover:bg-accent',
						}}
						month={displayedMonth}
						onDayClick={handleDayClick}
						onMonthChange={(date) => {
							setMonth(date.getMonth());
							setYear(date.getFullYear());
						}}
					/>

					{/* Legend */}
					<div className="mt-4 flex items-center justify-center gap-4 text-muted-foreground text-xs">
						<div className="flex items-center gap-1">
							<span className="h-2.5 w-2.5 rounded-full bg-green-500" />
							<span>Pago</span>
						</div>
						<div className="flex items-center gap-1">
							<span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
							<span>Pendente</span>
						</div>
						<div className="flex items-center gap-1">
							<span className="h-2.5 w-2.5 rounded-full bg-red-500" />
							<span>Vencido</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Payment Details Sheet */}
			<Sheet onOpenChange={setIsSheetOpen} open={isSheetOpen}>
				<SheetContent className="sm:max-w-lg">
					<SheetHeader>
						<SheetTitle>
							Pagamentos -{' '}
							{selectedDate
								? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', {
										weekday: 'long',
										day: 'numeric',
										month: 'long',
									})
								: ''}
						</SheetTitle>
						<SheetDescription>
							{selectedPayments ? (
								<>
									Total: {selectedPayments.payments.length} cobranças |{' '}
									<span className="text-green-600">
										Pago: {formatCurrency(selectedPayments.totals.paid)}
									</span>{' '}
									|{' '}
									<span className="text-yellow-600">
										Pendente: {formatCurrency(selectedPayments.totals.pending)}
									</span>
									{selectedPayments.totals.overdue > 0 && (
										<>
											{' '}
											|{' '}
											<span className="text-red-600">
												Vencido: {formatCurrency(selectedPayments.totals.overdue)}
											</span>
										</>
									)}
								</>
							) : (
								'Nenhum pagamento encontrado'
							)}
						</SheetDescription>
					</SheetHeader>

					<div className="mt-6">
						{selectedPayments && selectedPayments.payments.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Descrição</TableHead>
										<TableHead className="text-right">Valor</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{selectedPayments.payments.map(
										(payment) =>
											payment && (
												<TableRow key={payment.id}>
													<TableCell className="max-w-37.5 truncate">
														{(payment as any)?.description || 'Cobrança'}
													</TableCell>
													<TableCell className="text-right">
														{formatCurrency((payment as unknown as { value?: number }).value ?? 0)}
													</TableCell>
													<TableCell>
														<Badge
															className={
																STATUS_CONFIG[
																	(payment as unknown as { status?: string })
																		.status as keyof typeof STATUS_CONFIG
																]?.color
															}
														>
															{STATUS_CONFIG[
																(payment as unknown as { status?: string })
																	.status as keyof typeof STATUS_CONFIG
															]?.label || (payment as unknown as { status?: string }).status}
														</Badge>
													</TableCell>
												</TableRow>
											),
									)}
								</TableBody>
							</Table>
						) : (
							<p className="text-center text-muted-foreground">Nenhum pagamento nesta data.</p>
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
