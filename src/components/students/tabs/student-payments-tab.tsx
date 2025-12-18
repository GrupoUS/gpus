'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useAction, useQuery } from 'convex/react';
import { Copy, CreditCard, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface StudentPaymentsTabProps {
	studentId: Id<'students'>;
}

export function StudentPaymentsTab({ studentId }: StudentPaymentsTabProps) {
	const { toast } = useToast();

	// Fetch student to get Asaas ID
	const student = useQuery(api.students.getById, { id: studentId });

	const payments = useQuery(api.asaas.getPaymentsByStudent, {
		studentId: studentId,
	});

	const createPayment = useAction(api.asaas.actions.createAsaasPayment);

	const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// New Payment Form
	const [billingType, setBillingType] = useState<'BOLETO' | 'PIX' | 'CREDIT_CARD'>('PIX');
	const [amount, setAmount] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [description, setDescription] = useState('');
	const [installments, setInstallments] = useState('1');

	const handleCreatePayment = async () => {
		if (!student?.asaasCustomerId) {
			toast({
				title: 'Erro',
				description: 'Aluno não sincronizado com Asaas.',
				variant: 'destructive',
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await createPayment({
				studentId: studentId,
				asaasCustomerId: student.asaasCustomerId,
				billingType: billingType,
				value: Number.parseFloat(amount),
				dueDate: dueDate,
				description: description,
				installmentCount:
					Number.parseInt(installments, 10) > 1 ? Number.parseInt(installments, 10) : undefined,
				installmentValue:
					Number.parseInt(installments, 10) > 1
						? Number.parseFloat(amount) / Number.parseInt(installments, 10)
						: undefined,
			});

			toast({ title: 'Sucesso', description: 'Cobrança gerada com sucesso!' });
			setIsNewPaymentOpen(false);
			// Reset form
			setAmount('');
			setDescription('');
			setInstallments('1');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Erro desconhecido';
			toast({ title: 'Erro', description: message, variant: 'destructive' });
		} finally {
			setIsSubmitting(false);
		}
	};

	const getStatusBadge = (status: string) => {
		const map: any = {
			PENDING: 'bg-yellow-500',
			RECEIVED: 'bg-green-500',
			CONFIRMED: 'bg-green-600',
			OVERDUE: 'bg-red-500',
			REFUNDED: 'bg-purple-500',
			DELETED: 'bg-gray-400',
			CANCELLED: 'bg-gray-500',
		};
		return (
			<Badge className={`${map[status] || 'bg-gray-500'} hover:${map[status] || 'bg-gray-500'}`}>
				{status}
			</Badge>
		);
	};

	if (!student) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-medium flex items-center gap-2">
					<CreditCard className="h-5 w-5" />
					Histórico Financeiro (Asaas)
				</h3>

				<Dialog open={isNewPaymentOpen} onOpenChange={setIsNewPaymentOpen}>
					<DialogTrigger asChild>
						<Button disabled={!student.asaasCustomerId}>
							<Plus className="w-4 h-4 mr-2" />
							Nova Cobrança
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Nova Cobrança Asaas</DialogTitle>
							<DialogDescription>
								Gera uma nova cobrança (Pix, Boleto, Cartão) para este aluno.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Tipo</Label>
								<Select value={billingType} onValueChange={(v: any) => setBillingType(v)}>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Selecione" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PIX">Pix</SelectItem>
										<SelectItem value="BOLETO">Boleto</SelectItem>
										<SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Valor Total</Label>
								<Input
									type="number"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									className="col-span-3"
									placeholder="0.00"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Parcelas</Label>
								<Input
									type="number"
									value={installments}
									onChange={(e) => setInstallments(e.target.value)}
									className="col-span-3"
									placeholder="1"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Vencimento</Label>
								<Input
									type="date"
									value={dueDate}
									onChange={(e) => setDueDate(e.target.value)}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Descrição</Label>
								<Input
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="col-span-3"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsNewPaymentOpen(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreatePayment} disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Gerar Cobrança
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{!student.asaasCustomerId && (
				<div className="bg-yellow-500/10 text-yellow-600 p-4 rounded-md border border-yellow-500/20 text-sm">
					Atenção: Este aluno ainda não possui ID Asaas. A sincronização ocorre automaticamente ao
					editar CPF/Email, ou contate o suporte.
				</div>
			)}

			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Data</TableHead>
								<TableHead>Descrição</TableHead>
								<TableHead>Vencimento</TableHead>
								<TableHead>Valor</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Forma</TableHead>
								<TableHead className="text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{payments === undefined ? (
								<TableRow>
									<TableCell colSpan={7} className="text-center py-8">
										<Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
									</TableCell>
								</TableRow>
							) : payments.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
										Nenhuma cobrança encontrada.
									</TableCell>
								</TableRow>
							) : (
								payments.map((payment: Doc<'asaasPayments'>) => (
									<TableRow key={payment._id}>
										<TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
										<TableCell>{payment.description || '-'}</TableCell>
										<TableCell>
											{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '-'}
										</TableCell>
										<TableCell>
											{new Intl.NumberFormat('pt-BR', {
												style: 'currency',
												currency: 'BRL',
											}).format(payment.value)}
											{payment.installmentNumber &&
												` (${payment.installmentNumber}/${payment.totalInstallments || '?'})`}
										</TableCell>
										<TableCell>{getStatusBadge(payment.status)}</TableCell>
										<TableCell>{payment.billingType}</TableCell>
										<TableCell className="text-right">
											{payment.boletoUrl && (
												<Button variant="ghost" size="sm" asChild>
													<a href={payment.boletoUrl} target="_blank" rel="noopener noreferrer">
														Boleto
													</a>
												</Button>
											)}
											{payment.pixQrCode && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														if (payment.pixQrCode) {
															(navigator as any).clipboard.writeText(payment.pixQrCode);
															toast({ title: 'Copia e Cola copiado!' });
														}
													}}
												>
													<Copy className="w-4 h-4 mr-1" />
													Pix
												</Button>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
