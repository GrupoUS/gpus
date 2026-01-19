import type { Id } from '@convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, Phone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { leadStatusLabels, leadStatusVariants } from '@/lib/constants';

interface MarketingLead {
	_id: Id<'marketing_leads'>;
	name: string;
	email: string;
	phone: string;
	interest: string;
	message?: string;
	lgpdConsent: boolean;
	whatsappConsent: boolean;
	status: 'new' | 'contacted' | 'converted' | 'unsubscribed';
	utmSource?: string;
	createdAt: number;
}

interface LeadCaptureTableProps {
	leads: MarketingLead[];
	onStatusUpdate: (
		leadId: Id<'marketing_leads'>,
		newStatus: 'new' | 'contacted' | 'converted' | 'unsubscribed',
	) => void;
}

function getStatusBadge(status: string) {
	const variant = leadStatusVariants[status] || 'secondary';
	return <Badge variant={variant}>{leadStatusLabels[status] || status}</Badge>;
}

export function LeadCaptureTable({ leads, onStatusUpdate }: LeadCaptureTableProps) {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Contato</TableHead>
						<TableHead>Interesse</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Origem (UTM)</TableHead>
						<TableHead>Data</TableHead>
						<TableHead className="text-right">Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{leads.map((lead) => (
						<TableRow key={lead._id}>
							<TableCell>
								<div className="flex flex-col">
									<span className="font-medium">{lead.name}</span>
									<div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
										<Mail className="h-3 w-3" />
										{lead.email}
									</div>
									<div className="flex items-center gap-2 text-muted-foreground text-xs">
										<Phone className="h-3 w-3" />
										{lead.phone}
									</div>
								</div>
							</TableCell>
							<TableCell>
								<Badge variant="outline">{lead.interest}</Badge>
							</TableCell>
							<TableCell>{getStatusBadge(lead.status)}</TableCell>
							<TableCell>
								<span className="text-muted-foreground text-sm">{lead.utmSource || '-'}</span>
							</TableCell>
							<TableCell>
								<div className="flex flex-col text-muted-foreground text-sm">
									<span>
										{formatDistanceToNow(lead.createdAt, {
											addSuffix: true,
											locale: ptBR,
										})}
									</span>
									{lead.lgpdConsent && (
										<span className="flex items-center gap-1 text-[10px] text-green-600">
											<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
											LGPD
										</span>
									)}
								</div>
							</TableCell>
							<TableCell className="text-right">
								<Select
									onValueChange={(value: 'new' | 'contacted' | 'converted' | 'unsubscribed') =>
										onStatusUpdate(lead._id, value)
									}
									value={lead.status}
								>
									<SelectTrigger className="ml-auto h-8 w-[140px] text-xs">
										<SelectValue placeholder="Alterar Status" />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(leadStatusLabels).map(([key, label]) => (
											<SelectItem key={key} value={key}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</TableCell>
						</TableRow>
					))}
					{leads.length === 0 && (
						<TableRow>
							<TableCell className="h-24 text-center" colSpan={6}>
								Nenhum lead encontrado. Ajuste os filtros ou aguarde novos cadastros.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
