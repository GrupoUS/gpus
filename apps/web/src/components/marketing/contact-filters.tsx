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

interface ContactFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	status: string;
	onStatusChange: (value: string) => void;
	sourceType: string;
	onSourceTypeChange: (value: string) => void;
	onClear: () => void;
}

const statusLabels: Record<string, string> = {
	all: 'Todos Status',
	subscribed: 'Inscrito',
	unsubscribed: 'Cancelado',
	pending: 'Pendente',
};

const typeLabels: Record<string, string> = {
	all: 'Todos os Tipos',
	lead: 'Lead',
	student: 'Aluno',
};

export function ContactFilters({
	search,
	onSearchChange,
	status,
	onStatusChange,
	sourceType,
	onSourceTypeChange,
	onClear,
}: ContactFiltersProps) {
	const hasFilters = search || status !== 'all' || sourceType !== 'all';

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="relative">
				<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					className="pl-9"
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Buscar por email ou nome..."
					value={search}
				/>
			</div>

			{/* Filters Row */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Status Filter */}
				<Select onValueChange={onStatusChange} value={status}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos Status</SelectItem>
						<SelectItem value="subscribed">Inscrito</SelectItem>
						<SelectItem value="unsubscribed">Cancelado</SelectItem>
						<SelectItem value="pending">Pendente</SelectItem>
					</SelectContent>
				</Select>

				{/* Type Filter */}
				<Select onValueChange={onSourceTypeChange} value={sourceType}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os Tipos</SelectItem>
						<SelectItem value="lead">Lead</SelectItem>
						<SelectItem value="student">Aluno</SelectItem>
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
					{sourceType !== 'all' && (
						<Badge className="gap-1" variant="secondary">
							Tipo: {typeLabels[sourceType] || sourceType}
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onSourceTypeChange('all')}
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
