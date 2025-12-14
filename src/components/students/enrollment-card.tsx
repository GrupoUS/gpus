'use client';

import type { Doc } from '@convex/_generated/dataModel';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EnrollmentCardProps {
	enrollment: Doc<'enrollments'>;
	onClick?: () => void;
}

const productLabels: Record<string, string> = {
	trintae3: 'TRINTAE3',
	otb: 'OTB',
	black_neon: 'Black Neon',
	comunidade: 'Comunidade',
	auriculo: 'Auriculo',
	na_mesa_certa: 'Na Mesa Certa',
};

const statusLabels: Record<string, string> = {
	ativo: 'Ativo',
	concluido: 'Concluído',
	cancelado: 'Cancelado',
	pausado: 'Pausado',
	aguardando_inicio: 'Aguardando Início',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
	ativo: 'default',
	concluido: 'default',
	cancelado: 'destructive',
	pausado: 'outline',
	aguardando_inicio: 'secondary',
};

const paymentStatusColors: Record<string, string> = {
	em_dia: 'text-green-500',
	atrasado: 'text-red-500',
	quitado: 'text-blue-500',
	cancelado: 'text-gray-500',
};

export function EnrollmentCard({ enrollment, onClick }: EnrollmentCardProps) {
	const progress = enrollment.progress ?? 0;
	const paidInstallments = enrollment.paidInstallments ?? 0;

	return (
		<Card
			className={cn(
				'transition-all hover:shadow-md',
				onClick && 'cursor-pointer hover:border-primary/50',
			)}
			onClick={onClick}
		>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-sm">{productLabels[enrollment.product]}</h3>
					<Badge variant={statusVariants[enrollment.status]}>
						{statusLabels[enrollment.status]}
					</Badge>
				</div>
				{enrollment.cohort && (
					<p className="text-xs text-muted-foreground">Turma: {enrollment.cohort}</p>
				)}
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Progress */}
				<div className="space-y-1">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted-foreground">Progresso</span>
						<span className="font-medium">{progress}%</span>
					</div>
					<Progress value={progress} className="h-2" />
					{enrollment.modulesCompleted !== undefined && enrollment.totalModules && (
						<p className="text-xs text-muted-foreground">
							{enrollment.modulesCompleted} de {enrollment.totalModules} módulos
						</p>
					)}
				</div>

				{/* Payment Info */}
				<div className="flex items-center justify-between pt-2 border-t">
					<div className="space-y-0.5">
						<p className="text-xs text-muted-foreground">Pagamento</p>
						<p className={cn('text-sm font-medium', paymentStatusColors[enrollment.paymentStatus])}>
							{paidInstallments}/{enrollment.installments} parcelas
						</p>
					</div>
					<div className="text-right">
						<p className="text-xs text-muted-foreground">Valor Total</p>
						<p className="text-sm font-medium">
							{new Intl.NumberFormat('pt-BR', {
								style: 'currency',
								currency: 'BRL',
							}).format(enrollment.totalValue)}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
