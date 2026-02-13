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
				<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					className="pl-9"
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Buscar por nome, email ou telefone..."
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
						<SelectItem value="ativo">Ativos</SelectItem>
						<SelectItem value="inativo">Inativos</SelectItem>
						<SelectItem value="pausado">Pausados</SelectItem>
						<SelectItem value="formado">Formados</SelectItem>
					</SelectContent>
				</Select>

				{/* Churn Risk Filter */}
				<Select onValueChange={onChurnRiskChange} value={churnRisk}>
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
				<Select onValueChange={onProductChange} value={product}>
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
					<Button className="ml-auto gap-1" onClick={onClear} size="sm" variant="ghost">
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
							Status: {status}
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onStatusChange('all')}
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{churnRisk !== 'all' && (
						<Badge className="gap-1" variant="secondary">
							Risco: {churnRisk}
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onChurnRiskChange('all')}
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{product !== 'all' && (
						<Badge className="gap-1" variant="secondary">
							Produto: {productLabels[product] || product}
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onProductChange('all')}
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
