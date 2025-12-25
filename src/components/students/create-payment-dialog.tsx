import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAction, useQuery, useMutation } from 'convex/react';
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
	const billingTypeId = useId();
	const valueId = useId();
	const installmentsId = useId();
	const dueDateId = useId();
	const descriptionId = useId();

	// Form state
	const [billingType, setBillingType] = useState<BillingType>('PIX');
	const [value, setValue] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [description, setDescription] = useState('');
	const [installmentCount, setInstallmentCount] = useState('1');

	// Get student data to check if synced with Asaas
	const student = useQuery(api.students.getById, { id: studentId });

	// Create payment action
	const createPayment = useAction(api.asaas.actions.createAsaasPayment);
	const syncStudent = useMutation(api.asaas.mutations.syncStudentAsCustomer);

	const asaasCustomerId = (student as { asaasCustomerId?: string } | null)?.asaasCustomerId;
	const syncError = (student as { asaasCustomerSyncError?: string } | null)?.asaasCustomerSyncError;
	const studentName = (student as { name?: string } | null)?.name || 'Aluno';
	const studentCpf = (student as { cpf?: string } | null)?.cpf;

	const handleManualSync = async () => {
		try {
			await syncStudent({ studentId });
			toast.success('Aluno sincronizado com sucesso!');
		} catch (error: any) {
			toast.error('Falha na sincronização', {
				description: error.message,
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

	const validateForm = (numericValue: number) => {
		if (!asaasCustomerId) {
			toast.error('Aluno não sincronizado com Asaas', {
				description: 'O aluno precisa ter CPF e ser sincronizado antes de criar cobranças.',
			});
			return false;
		}

		if (!studentCpf) {
			toast.error('CPF obrigatório', {
				description: 'O aluno precisa ter CPF cadastrado para gerar cobranças.',
			});
			return false;
		}

		if (!numericValue || numericValue <= 0) {
			toast.error('Valor inválido', {
				description: 'Informe um valor maior que zero.',
			});
			return false;
		}

		if (!dueDate) {
			toast.error('Data de vencimento obrigatória');
			return false;
		}

		const dueDateObj = new Date(dueDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (dueDateObj < today) {
			toast.error('Data de vencimento inválida', {
				description: 'A data de vencimento deve ser hoje ou no futuro.',
			});
			return false;
		}

		return true;
	};

	const handleSubmit = async () => {
		const numericValue = Number.parseFloat(value);

		if (!(validateForm(numericValue) && asaasCustomerId)) {
			return;
		}

		const customerId = asaasCustomerId;
		setIsSubmitting(true);
		try {
			const numInstallments = Number.parseInt(installmentCount, 10);
			const installmentValue = numInstallments > 1 ? numericValue / numInstallments : undefined;

			await createPayment({
				studentId,
				asaasCustomerId: customerId,
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
							<Label htmlFor={valueId}>Valor Total (R$)</Label>
							<Input
								id={valueId}
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
							<Label htmlFor={dueDateId}>Data de Vencimento</Label>
							<Input
								id={dueDateId}
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								min={new Date().toISOString().split('T')[0]}
							/>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Label htmlFor={descriptionId}>Descrição (opcional)</Label>
							<Textarea
								id={descriptionId}
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
