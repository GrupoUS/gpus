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
import { productLabels } from '@/lib/constants';

interface StudentFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	status: string;
	onStatusChange: (value: string) => void;
	churnRisk: string;
	onChurnRiskChange: (value: string) => void;
	product: string;
	onProductChange: (value: string) => void;
	onClear: () => void;
}

export function StudentFilters({
	search,
	onSearchChange,
	status,
	onStatusChange,
	churnRisk,
	onChurnRiskChange,
	product,
	onProductChange,
	onClear,
}: StudentFiltersProps) {
	const hasFilters = search || status !== 'all' || churnRisk !== 'all' || product !== 'all';

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Buscar por nome, email ou telefone..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Filters Row */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Status Filter */}
				<Select value={status} onValueChange={onStatusChange}>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos Status</SelectItem>
						<SelectItem value="ativo">Ativos</SelectItem>
						<SelectItem value="inativo">Inativos</SelectItem>
						<SelectItem value="pausado">Pausados</SelectItem>
						<SelectItem value="formado">Formados</SelectItem>
					</SelectContent>
				</Select>

				{/* Churn Risk Filter */}
				<Select value={churnRisk} onValueChange={onChurnRiskChange}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Risco de Churn" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos Riscos</SelectItem>
						<SelectItem value="baixo">Risco Baixo</SelectItem>
						<SelectItem value="medio">Risco Médio</SelectItem>
						<SelectItem value="alto">Risco Alto</SelectItem>
					</SelectContent>
				</Select>

				{/* Product Filter */}
				<Select value={product} onValueChange={onProductChange}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Produto" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos Produtos</SelectItem>
						<SelectItem value="trintae3">TRINTAE3</SelectItem>
						<SelectItem value="otb">OTB MBA</SelectItem>
						<SelectItem value="black_neon">Black NEON</SelectItem>
						<SelectItem value="comunidade">Comunidade US</SelectItem>
						<SelectItem value="auriculo">Aurículo</SelectItem>
						<SelectItem value="na_mesa_certa">Na Mesa Certa</SelectItem>
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
							Status: {status}
							<button
								type="button"
								onClick={() => onStatusChange('all')}
								className="ml-1 hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{churnRisk !== 'all' && (
						<Badge variant="secondary" className="gap-1">
							Risco: {churnRisk}
							<button
								type="button"
								onClick={() => onChurnRiskChange('all')}
								className="ml-1 hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{product !== 'all' && (
						<Badge variant="secondary" className="gap-1">
							Produto: {productLabels[product] || product}
							<button
								type="button"
								onClick={() => onProductChange('all')}
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
