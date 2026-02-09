import { UserCircle } from 'lucide-react';
import { useId } from 'react';

import { trpc } from '../../lib/trpc';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface LeadOwnerSelectProps {
	leadId: number;
	currentOwnerId?: number | null;
}

function getRoleBadge(role: string): string {
	if (role === 'sdr') return 'SDR';
	if (role === 'admin') return 'Vendas';
	return '';
}

export function LeadOwnerSelect({ leadId, currentOwnerId }: LeadOwnerSelectProps) {
	const selectId = useId();
	const { data: vendors } = trpc.users.listSystemUsers.useQuery();
	const updateLead = trpc.leads.update.useMutation();

	const handleChange = async (value: string) => {
		await updateLead.mutateAsync({
			leadId,
			// @ts-expect-error - Migration: error TS2322
			patch: { assignedTo: value === 'none' ? undefined : Number(value) },
		});
	};

	if (!vendors) {
		return (
			<div className="flex items-center gap-2 text-muted-foreground text-sm">
				<UserCircle className="h-4 w-4" />
				<span>Carregando...</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={selectId}>Responsável</Label>
			<Select
				onValueChange={handleChange}
				value={currentOwnerId != null ? String(currentOwnerId) : 'none'}
			>
				<SelectTrigger className="w-full" id={selectId}>
					<SelectValue placeholder="Selecione o responsável" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="none">
						<span className="text-muted-foreground">Sem responsável</span>
					</SelectItem>
					{vendors.map((vendor) => (
						// @ts-expect-error - Migration: error TS2322
						<SelectItem key={vendor.id} value={vendor.id}>
							<div className="flex items-center gap-2">
								<span>{vendor.name}</span>
								<span className="text-muted-foreground text-xs uppercase">
									{getRoleBadge(vendor.role)}
								</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
