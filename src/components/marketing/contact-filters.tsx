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
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Buscar por email ou nome..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Filters Row */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Status Filter */}
				<Select value={status} onValueChange={onStatusChange}>
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
				<Select value={sourceType} onValueChange={onSourceTypeChange}>
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
					<Button variant="ghost" size="sm" onClick={onClear} className="gap-1">
						<X className="h-4 w-4" />
						Limpar
					</Button>
				)}
			</div>

			{/* Active Filters Summary */}
			{hasFilters && (
				<div className="flex flex-wrap gap-2">
					{search && (
						<Badge variant="secondary" className="gap-1">
							Busca: "{search}"
							<button
								type="button"
								onClick={() => onSearchChange('')}
								className="ml-1 hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{status !== 'all' && (
						<Badge variant="secondary" className="gap-1">
							Status: {statusLabels[status] || status}
							<button
								type="button"
								onClick={() => onStatusChange('all')}
								className="ml-1 hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{sourceType !== 'all' && (
						<Badge variant="secondary" className="gap-1">
							Tipo: {typeLabels[sourceType] || sourceType}
							<button
								type="button"
								onClick={() => onSourceTypeChange('all')}
								className="ml-1 hover:text-destructive"
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
