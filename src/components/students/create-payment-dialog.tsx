import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAction, useQuery } from 'convex/react';
import { Loader2, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';

interface CreatePaymentDialogProps {
	studentId: Id<'students'>;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

type BillingType = 'BOLETO' | 'PIX' | 'CREDIT_CARD';

export function CreatePaymentDialog({ studentId, trigger, onSuccess }: CreatePaymentDialogProps) {
	const [open, setOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Generate unique IDs for form accessibility
	const formId = useId();
	const billingTypeId = `${formId}-billingType`;
	const valueInputId = `${formId}-value`;
	const installmentsId = `${formId}-installments`;
	const dueDateInputId = `${formId}-dueDate`;
	const descriptionInputId = `${formId}-description`;

	// Form state
	const [billingType, setBillingType] = useState<BillingType>('PIX');
	const [value, setValue] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [description, setDescription] = useState('');
	const [installmentCount, setInstallmentCount] = useState('1');

	// Get student data to check if synced with Asaas
	// biome-ignore lint/suspicious/noExplicitAny: Deep type instantiation workaround for Convex
	const student: any = useQuery(api.students.getById as any, { id: studentId });

	// Create payment action
	const createPayment = useAction(api.asaas.actions.createAsaasPayment);
	const syncStudent = useAction(api.asaas.mutations.syncStudentAsCustomer);

	const asaasCustomerId = student?.asaasCustomerId;
	const syncError = student?.asaasCustomerSyncError;
	const studentName = student?.name || 'Aluno';
	const studentCpf = student?.cpf;

	const handleManualSync = async () => {
		try {
			await syncStudent({ studentId });
			toast.success('Aluno sincronizado com sucesso!');
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
			toast.error('Falha na sincronização', {
				description: errorMessage,
			});
		}
	};

	const resetForm = () => {
		setBillingType('PIX');
		setValue('');
		setDueDate('');
		setDescription('');
		setInstallmentCount('1');
	};

	// Extract validation logic to reduce cognitive complexity and return validated data
	const validatePaymentForm = (): { numericValue: number; asaasCustomerId: string } | null => {
		if (!asaasCustomerId) {
			toast.error('Aluno não sincronizado com Asaas', {
				description: 'O aluno precisa ter CPF e ser sincronizado antes de criar cobranças.',
			});
			return null;
		}

		if (!studentCpf) {
			toast.error('CPF obrigatório', {
				description: 'O aluno precisa ter CPF cadastrado para gerar cobranças.',
			});
			return null;
		}

		const numericValue = Number.parseFloat(value);
		if (!numericValue || numericValue <= 0) {
			toast.error('Valor inválido', {
				description: 'Informe um valor maior que zero.',
			});
			return null;
		}

		if (!dueDate) {
			toast.error('Data de vencimento obrigatória');
			return null;
		}

		const dueDateObj = new Date(dueDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (dueDateObj < today) {
			toast.error('Data de vencimento inválida', {
				description: 'A data de vencimento deve ser hoje ou no futuro.',
			});
			return null;
		}

		return { numericValue, asaasCustomerId };
	};

	const handleSubmit = async () => {
		const validatedData = validatePaymentForm();
		if (!validatedData) return;

		const { numericValue, asaasCustomerId } = validatedData;

		setIsSubmitting(true);
		try {
			const numInstallments = Number.parseInt(installmentCount, 10);
			const installmentValue = numInstallments > 1 ? numericValue / numInstallments : undefined;

			await createPayment({
				studentId,
				asaasCustomerId,
				billingType,
				value: numericValue,
				dueDate,
				description: description || `Cobrança para ${studentName}`,
				installmentCount: numInstallments > 1 ? numInstallments : undefined,
				installmentValue,
			});

			toast.success('Cobrança criada com sucesso!', {
				description: `Cobrança de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue)} gerada.`,
			});

			resetForm();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			toast.error('Erro ao criar cobrança', {
				description: error instanceof Error ? error.message : 'Erro desconhecido',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Default trigger button
	const defaultTrigger = (
		<Button variant="outline">
			<Plus className="w-4 h-4 mr-2" />
			Criar Cobrança
		</Button>
	);

	// Check if student is synced
	const canCreatePayment = !!asaasCustomerId && !!studentCpf;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Nova Cobrança Asaas</DialogTitle>
					<DialogDescription>Crie uma cobrança para {studentName}</DialogDescription>
				</DialogHeader>

				{!canCreatePayment ? (
					<div className="bg-yellow-500/10 text-yellow-600 p-4 rounded-md border border-yellow-500/20 text-sm">
						<p className="font-medium mb-1">Aluno não pode receber cobranças</p>
						<p className="text-xs">
							{!studentCpf
								? 'Cadastre o CPF do aluno primeiro.'
								: syncError
									? `Erro na sincronização: ${syncError}. Clique em "Sincronizar" para tentar novamente.`
									: 'O aluno precisa ser sincronizado com o Asaas. Edite e salve o aluno para sincronizar.'}
						</p>
						{syncError && (
							<Button size="sm" variant="outline" className="mt-2" onClick={handleManualSync}>
								Sincronizar Agora
							</Button>
						)}
					</div>
				) : (
					<div className="space-y-4">
						{/* Billing Type */}
						<div className="space-y-2">
							<Label htmlFor={billingTypeId}>Forma de Pagamento</Label>
							<Select value={billingType} onValueChange={(v) => setBillingType(v as BillingType)}>
								<SelectTrigger id={billingTypeId}>
									<SelectValue placeholder="Selecione" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PIX">PIX</SelectItem>
									<SelectItem value="BOLETO">Boleto Bancário</SelectItem>
									<SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Value */}
						<div className="space-y-2">
							<Label htmlFor={valueInputId}>Valor Total (R$)</Label>
							<Input
								id={valueInputId}
								type="number"
								min="0.01"
								step="0.01"
								value={value}
								onChange={(e) => setValue(e.target.value)}
								placeholder="0,00"
							/>
						</div>

						{/* Installments */}
						<div className="space-y-2">
							<Label htmlFor={installmentsId}>Parcelas</Label>
							<Select value={installmentCount} onValueChange={setInstallmentCount}>
								<SelectTrigger id={installmentsId}>
									<SelectValue placeholder="Selecione" />
								</SelectTrigger>
								<SelectContent>
									{Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
										<SelectItem key={n} value={n.toString()}>
											{n}x{' '}
											{n > 1 &&
												value &&
												`de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.parseFloat(value) / n)}`}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Due Date */}
						<div className="space-y-2">
							<Label htmlFor={dueDateInputId}>Data de Vencimento</Label>
							<Input
								id={dueDateInputId}
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								min={new Date().toISOString().split('T')[0]}
							/>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Label htmlFor={descriptionInputId}>Descrição (opcional)</Label>
							<Textarea
								id={descriptionInputId}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Mensalidade, Matrícula, etc."
								rows={2}
							/>
						</div>
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting || !canCreatePayment}>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Gerar Cobrança
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
