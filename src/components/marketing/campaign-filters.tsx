'use client';

import { Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface CampaignFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	status: string;
	onStatusChange: (value: string) => void;
	onClear: () => void;
}

const statusLabels: Record<string, string> = {
	all: 'Todos Status',
	draft: 'Rascunho',
	scheduled: 'Agendada',
	sending: 'Enviando',
	sent: 'Enviada',
	failed: 'Falhou',
};

export function CampaignFilters({
	search,
	onSearchChange,
	status,
	onStatusChange,
	onClear,
}: CampaignFiltersProps) {
	const hasFilters = search || status !== 'all';

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="relative">
				<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					className="pl-9"
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Buscar por nome ou assunto..."
					value={search}
				/>
			</div>

			{/* Filters Row */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Status Filter */}
				<Select onValueChange={onStatusChange} value={status}>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos Status</SelectItem>
						<SelectItem value="draft">Rascunho</SelectItem>
						<SelectItem value="scheduled">Agendada</SelectItem>
						<SelectItem value="sending">Enviando</SelectItem>
						<SelectItem value="sent">Enviada</SelectItem>
						<SelectItem value="failed">Falhou</SelectItem>
					</SelectContent>
				</Select>

				{/* Clear Filters */}
				{hasFilters && (
					<Button className="gap-1" onClick={onClear} size="sm" variant="ghost">
						<X className="h-4 w-4" />
						Limpar
					</Button>
				)}
			</div>

			{/* Active Filters Summary */}
			{hasFilters && (
				<div className="flex flex-wrap gap-2">
					{search && (
						<Badge className="gap-1" variant="secondary">
							Busca: "{search}"
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onSearchChange('')}
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{status !== 'all' && (
						<Badge className="gap-1" variant="secondary">
							Status: {statusLabels[status] || status}
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onStatusChange('all')}
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
				</div>
			)}
		</div>
	);
}
