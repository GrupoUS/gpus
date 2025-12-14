import { Filter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface FilterState {
	search: string;
	stages: string[];
	temperature: string[];
	products: string[];
	source: string[];
}

interface LeadFiltersProps {
	onFiltersChange: (filters: FilterState) => void;
}

export function LeadFilters({ onFiltersChange }: LeadFiltersProps) {
	const [filters, setFilters] = useState<FilterState>({
		search: '',
		stages: [],
		temperature: [],
		products: [],
		source: [],
	});

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			onFiltersChange(filters);
		}, 300);
		return () => clearTimeout(timer);
	}, [filters, onFiltersChange]);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilters((prev) => ({ ...prev, search: e.target.value }));
	};

	const toggleFilter = (category: keyof FilterState, value: string) => {
		setFilters((prev) => {
			const current = prev[category] as string[];
			const updated = current.includes(value)
				? current.filter((item) => item !== value)
				: [...current, value];
			return { ...prev, [category]: updated };
		});
	};

	const clearFilters = () => {
		setFilters({
			search: '',
			stages: [],
			temperature: [],
			products: [],
			source: [],
		});
	};

	const activeFiltersCount =
		filters.stages.length +
		filters.temperature.length +
		filters.products.length +
		filters.source.length;

	return (
		<div className="flex flex-col sm:flex-row gap-3 w-full bg-card/50 p-2 rounded-lg border border-border/50">
			<div className="relative flex-1">
				<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Buscar leads..."
					value={filters.search}
					onChange={handleSearchChange}
					className="pl-9 bg-background/50 border-border/50"
				/>
			</div>

			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" className="gap-2 border-border/50 bg-background/50 relative">
						<Filter className="h-4 w-4" />
						Filtros
						{activeFiltersCount > 0 && (
							<Badge
								variant="secondary"
								className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-[10px]"
							>
								{activeFiltersCount}
							</Badge>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80 p-4" align="end">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium leading-none">Filtros</h4>
							<Button
								variant="ghost"
								size="sm"
								className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
								onClick={clearFilters}
							>
								Limpar
							</Button>
						</div>

						<Separator />

						{/* Temperatura */}
						<div className="space-y-2">
							<h5 className="text-sm font-medium text-muted-foreground">Temperatura</h5>
							<div className="grid grid-cols-2 gap-2">
								{[
									{ id: 'frio', label: '❄️ Frio' },
									{ id: 'morno', label: '🌤️ Morno' },
									{ id: 'quente', label: '🔥 Quente' },
								].map((item) => (
									<div key={item.id} className="flex items-center space-x-2">
										<Checkbox
											id={`temp-${item.id}`}
											checked={filters.temperature.includes(item.id)}
											onCheckedChange={() => toggleFilter('temperature', item.id)}
										/>
										<Label htmlFor={`temp-${item.id}`} className="text-sm font-normal">
											{item.label}
										</Label>
									</div>
								))}
							</div>
						</div>

						<Separator />

						{/* Produtos */}
						<div className="space-y-2">
							<h5 className="text-sm font-medium text-muted-foreground">Produtos</h5>
							<div className="grid grid-cols-2 gap-2">
								{[
									{ id: 'trintae3', label: 'TrintaE3' },
									{ id: 'otb', label: 'OTB' },
									{ id: 'black_neon', label: 'Black Neon' },
									{ id: 'comunidade', label: 'Comunidade' },
								].map((item) => (
									<div key={item.id} className="flex items-center space-x-2">
										<Checkbox
											id={`prod-${item.id}`}
											checked={filters.products.includes(item.id)}
											onCheckedChange={() => toggleFilter('products', item.id)}
										/>
										<Label htmlFor={`prod-${item.id}`} className="text-sm font-normal">
											{item.label}
										</Label>
									</div>
								))}
							</div>
						</div>

						<Separator />

						{/* Estágio */}
						<div className="space-y-2">
							<h5 className="text-sm font-medium text-muted-foreground">Estágio</h5>
							<div className="grid grid-cols-2 gap-2">
								{[
									{ id: 'novo', label: 'Novo' },
									{ id: 'primeiro_contato', label: 'Primeiro Contato' },
									{ id: 'qualificado', label: 'Qualificado' },
									{ id: 'proposta', label: 'Proposta' },
									{ id: 'negociacao', label: 'Negociação' },
									{ id: 'fechado_ganho', label: 'Fechado Ganho' },
									{ id: 'fechado_perdido', label: 'Fechado Perdido' },
								].map((item) => (
									<div key={item.id} className="flex items-center space-x-2">
										<Checkbox
											id={`stage-${item.id}`}
											checked={filters.stages.includes(item.id)}
											onCheckedChange={() => toggleFilter('stages', item.id)}
										/>
										<Label htmlFor={`stage-${item.id}`} className="text-sm font-normal">
											{item.label}
										</Label>
									</div>
								))}
							</div>
						</div>

						<Separator />

						{/* Origem */}
						<div className="space-y-2">
							<h5 className="text-sm font-medium text-muted-foreground">Origem</h5>
							<div className="grid grid-cols-2 gap-2">
								{[
									{ id: 'instagram', label: 'Instagram' },
									{ id: 'whatsapp', label: 'WhatsApp' },
									{ id: 'trafego_pago', label: 'Tráfego' },
									{ id: 'landing_page', label: 'Site' },
								].map((item) => (
									<div key={item.id} className="flex items-center space-x-2">
										<Checkbox
											id={`src-${item.id}`}
											checked={filters.source.includes(item.id)}
											onCheckedChange={() => toggleFilter('source', item.id)}
										/>
										<Label htmlFor={`src-${item.id}`} className="text-sm font-normal">
											{item.label}
										</Label>
									</div>
								))}
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>

			{activeFiltersCount > 0 && (
				<Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
					<X className="h-4 w-4 text-muted-foreground" />
				</Button>
			)}
		</div>
	);
}
