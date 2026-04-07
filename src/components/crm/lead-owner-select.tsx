import { useMutation, useQuery } from 'convex/react';
import { UserCircle } from 'lucide-react';
import { useId } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface LeadOwnerSelectProps {
	leadId: Id<'leads'>;
	currentOwnerId?: Id<'users'> | null;
}

function getRoleBadge(role: string): string {
	if (role === 'sdr') return 'SDR';
	if (role === 'admin') return 'Vendas';
	return '';
}

export function LeadOwnerSelect({ leadId, currentOwnerId }: LeadOwnerSelectProps) {
	const selectId = useId();
	const vendors = useQuery(api.users.listVendors);
	// biome-ignore lint/suspicious/noExplicitAny: Convex API type workaround
	const updateLead = useMutation((api as any).leads.updateLead);

	const handleChange = async (value: string) => {
		const assignedTo = value === 'none' ? undefined : (value as Id<'users'>);
		await updateLead({
			leadId,
			patch: { assignedTo },
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
			<Select onValueChange={handleChange} value={currentOwnerId ?? 'none'}>
				<SelectTrigger className="w-full" id={selectId}>
					<SelectValue placeholder="Selecione o responsável" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="none">
						<span className="text-muted-foreground">Sem responsável</span>
					</SelectItem>
					{vendors.map((vendor) => (
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
