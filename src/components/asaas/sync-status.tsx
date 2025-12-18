/**
 * Asaas Sync Status Component
 *
 * Displays sync status, progress, and logs for Asaas import operations.
 */

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	CreditCard,
	DollarSign,
	Loader2,
	RefreshCw,
	Repeat,
	Users,
} from 'lucide-react';

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type SyncType = 'customers' | 'payments' | 'subscriptions' | 'financial';

interface SyncLog {
	_id: string;
	syncType: SyncType;
	status: 'pending' | 'running' | 'completed' | 'failed';
	startedAt: number;
	completedAt?: number;
	recordsProcessed: number;
	recordsCreated: number;
	recordsUpdated: number;
	recordsFailed: number;
	errors?: string[];
	filters?: {
		startDate?: string;
		endDate?: string;
		status?: string;
	};
	initiatedBy: string;
	createdAt: number;
}

const syncTypeConfig: Record<SyncType, { label: string; icon: React.ReactNode; color: string }> = {
	customers: {
		label: 'Clientes',
		icon: <Users className="h-4 w-4" />,
		color: 'text-blue-500',
	},
	payments: {
		label: 'Pagamentos',
		icon: <CreditCard className="h-4 w-4" />,
		color: 'text-green-500',
	},
	subscriptions: {
		label: 'Assinaturas',
		icon: <Repeat className="h-4 w-4" />,
		color: 'text-purple-500',
	},
	financial: {
		label: 'Financeiro',
		icon: <DollarSign className="h-4 w-4" />,
		color: 'text-amber-500',
	},
};

function getStatusBadge(status: SyncLog['status']) {
	switch (status) {
		case 'completed':
			return (
				<Badge
					variant="outline"
					className="text-green-600 border-green-600 flex gap-1 items-center"
				>
					<CheckCircle2 className="h-3 w-3" />
					Concluído
				</Badge>
			);
		case 'running':
			return (
				<Badge variant="outline" className="text-blue-600 border-blue-600 flex gap-1 items-center">
					<Loader2 className="h-3 w-3 animate-spin" />
					Em progresso
				</Badge>
			);
		case 'failed':
			return (
				<Badge variant="outline" className="text-red-600 border-red-600 flex gap-1 items-center">
					<AlertCircle className="h-3 w-3" />
					Falhou
				</Badge>
			);
		default:
			return (
				<Badge
					variant="outline"
					className="text-yellow-600 border-yellow-600 flex gap-1 items-center"
				>
					<Clock className="h-3 w-3" />
					Pendente
				</Badge>
			);
	}
}

interface SyncStatusCardProps {
	syncType: SyncType;
	log: SyncLog | null;
	isRunning?: boolean;
}

export function SyncStatusCard({ syncType, log, isRunning }: SyncStatusCardProps) {
	const config = syncTypeConfig[syncType];

	if (!log) {
		return (
			<Card className="opacity-60">
				<CardHeader className="pb-2">
					<div className="flex items-center gap-2">
						<span className={config.color}>{config.icon}</span>
						<CardTitle className="text-sm">{config.label}</CardTitle>
					</div>
					<CardDescription>Nunca sincronizado</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const duration =
		log.completedAt && log.startedAt ? Math.round((log.completedAt - log.startedAt) / 1000) : null;

	return (
		<Card className={log.status === 'running' ? 'border-blue-500/50' : ''}>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className={config.color}>{config.icon}</span>
						<CardTitle className="text-sm">{config.label}</CardTitle>
					</div>
					{getStatusBadge(log.status)}
				</div>
				<CardDescription>
					{log.completedAt
						? `Há ${formatDistanceToNow(log.completedAt, { locale: ptBR })}`
						: log.status === 'running'
							? 'Em execução...'
							: format(log.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-0">
				{isRunning && <Progress value={undefined} className="h-1 mb-2" />}

				<div className="grid grid-cols-4 gap-2 text-center text-xs">
					<div>
						<div className="font-semibold">{log.recordsProcessed}</div>
						<div className="text-muted-foreground">Processados</div>
					</div>
					<div>
						<div className="font-semibold text-green-600">{log.recordsCreated}</div>
						<div className="text-muted-foreground">Criados</div>
					</div>
					<div>
						<div className="font-semibold text-blue-600">{log.recordsUpdated}</div>
						<div className="text-muted-foreground">Atualizados</div>
					</div>
					<div>
						<div className="font-semibold text-red-600">{log.recordsFailed}</div>
						<div className="text-muted-foreground">Erros</div>
					</div>
				</div>

				{duration !== null && log.status === 'completed' && (
					<p className="text-xs text-muted-foreground mt-2 text-center">Duração: {duration}s</p>
				)}

				{log.errors && log.errors.length > 0 && (
					<Accordion type="single" collapsible className="mt-2">
						<AccordionItem value="errors" className="border-t">
							<AccordionTrigger className="py-2 text-xs text-red-600">
								{log.errors.length} erro(s)
							</AccordionTrigger>
							<AccordionContent>
								<ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
									{log.errors.slice(0, 10).map((error, i) => (
										<li key={i} className="truncate">
											• {error}
										</li>
									))}
									{log.errors.length > 10 && (
										<li className="text-muted-foreground italic">
											...e mais {log.errors.length - 10} erros
										</li>
									)}
								</ul>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				)}
			</CardContent>
		</Card>
	);
}

/**
 * Full sync status dashboard showing all sync types
 */
export function SyncStatusDashboard() {
	// @ts-expect-error - Convex type inference is excessively deep for this query
	const lastSyncStatus = useQuery(api.asaas.sync.getLastSyncStatus) as
		| Record<SyncType, SyncLog | null>
		| undefined;

	if (!lastSyncStatus) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{(['customers', 'payments', 'subscriptions', 'financial'] as SyncType[]).map((syncType) => (
				<SyncStatusCard
					key={syncType}
					syncType={syncType}
					log={lastSyncStatus[syncType] as SyncLog | null}
					isRunning={lastSyncStatus[syncType]?.status === 'running'}
				/>
			))}
		</div>
	);
}

/**
 * Compact sync status indicator for use in the integrations page
 */
interface SyncStatusIndicatorProps {
	syncType: SyncType;
	className?: string;
}

export function SyncStatusIndicator({ syncType, className }: SyncStatusIndicatorProps) {
	// @ts-expect-error - Convex type inference is excessively deep for this query
	const lastSyncStatus = useQuery(api.asaas.sync.getLastSyncStatus) as
		| Record<SyncType, SyncLog | null>
		| undefined;

	if (!lastSyncStatus) {
		return (
			<span className={`text-xs text-muted-foreground ${className}`}>
				<RefreshCw className="h-3 w-3 inline mr-1" />
				Carregando...
			</span>
		);
	}

	const log = lastSyncStatus[syncType] as SyncLog | null;

	if (!log) {
		return <span className={`text-xs text-muted-foreground ${className}`}>Nunca sincronizado</span>;
	}

	if (log.status === 'running') {
		return (
			<span className={`text-xs text-blue-600 ${className}`}>
				<Loader2 className="h-3 w-3 inline mr-1 animate-spin" />
				Em progresso...
			</span>
		);
	}

	const timeAgo = formatDistanceToNow(log.completedAt || log.createdAt, {
		locale: ptBR,
		addSuffix: true,
	});

	return (
		<span
			className={`text-xs ${log.status === 'completed' ? 'text-green-600' : 'text-red-600'} ${className}`}
		>
			{log.status === 'completed' ? (
				<CheckCircle2 className="h-3 w-3 inline mr-1" />
			) : (
				<AlertCircle className="h-3 w-3 inline mr-1" />
			)}
			{log.recordsProcessed} registros • {timeAgo}
		</span>
	);
}
