import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
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
	tags: string[];
}

interface LeadFiltersProps {
	onFiltersChange: (filters: FilterState) => void;
}

export function LeadFilters({ onFiltersChange }: LeadFiltersProps) {
	const listTags = (api as any).tags.listTags;
	const tags = useQuery(listTags);

	const [filters, setFilters] = useState<FilterState>({
		search: '',
		stages: [],
		temperature: [],
		products: [],
		source: [],
		tags: [],
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
			tags: [],
		});
	};

	const activeFiltersCount =
		filters.stages.length +
		filters.temperature.length +
		filters.products.length +
		filters.source.length +
		filters.tags.length;

	return (
		<div className="flex w-full flex-col gap-3 rounded-lg border border-border/50 bg-card/50 p-2 sm:flex-row">
			<div className="relative flex-1">
				<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					className="border-border/50 bg-background/50 pl-9"
					onChange={handleSearchChange}
					placeholder="Buscar leads..."
					value={filters.search}
				/>
			</div>

			<Popover>
				<PopoverTrigger asChild>
					<Button className="relative gap-2 border-border/50 bg-background/50" variant="outline">
						<Filter className="h-4 w-4" />
						Filtros
						{activeFiltersCount > 0 && (
							<Badge
								className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary p-0 text-[10px] text-primary-foreground"
								variant="secondary"
							>
								{activeFiltersCount}
							</Badge>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-80 p-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium leading-none">Filtros</h4>
							<Button
								className="h-auto p-0 text-muted-foreground text-xs hover:text-foreground"
								onClick={clearFilters}
								size="sm"
								variant="ghost"
							>
								Limpar
							</Button>
						</div>

						<Separator />

						{/* Temperatura */}
						<div className="space-y-2">
							<h5 className="font-medium text-muted-foreground text-sm">Temperatura</h5>
							<div className="grid grid-cols-2 gap-2">
								{[
									{ id: 'frio', label: '❄️ Frio' },
									{ id: 'morno', label: '🌤️ Morno' },
									{ id: 'quente', label: '🔥 Quente' },
								].map((item) => (
									<div className="flex items-center space-x-2" key={item.id}>
										<Checkbox
											checked={filters.temperature.includes(item.id)}
											id={`temp-${item.id}`}
											onCheckedChange={() => toggleFilter('temperature', item.id)}
										/>
										<Label className="font-normal text-sm" htmlFor={`temp-${item.id}`}>
											{item.label}
										</Label>
									</div>
								))}
							</div>
						</div>

						<Separator />

						{/* Produtos */}
						<div className="space-y-2">
							<h5 className="font-medium text-muted-foreground text-sm">Produtos</h5>
							<div className="grid grid-cols-2 gap-2">
								{[
									{ id: 'trintae3', label: 'TrintaE3' },
									{ id: 'otb', label: 'OTB' },
									{ id: 'black_neon', label: 'Black Neon' },
									{ id: 'comunidade', label: 'Comunidade' },
								].map((item) => (
									<div className="flex items-center space-x-2" key={item.id}>
										<Checkbox
											checked={filters.products.includes(item.id)}
											id={`prod-${item.id}`}
											onCheckedChange={() => toggleFilter('products', item.id)}
										/>
										<Label className="font-normal text-sm" htmlFor={`prod-${item.id}`}>
											{item.label}
										</Label>
									</div>
								))}
							</div>
						</div>

						<Separator />

						{/* Estágio */}
						<div className="space-y-2">
							<h5 className="font-medium text-muted-foreground text-sm">Estágio</h5>
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
									<div className="flex items-center space-x-2" key={item.id}>
										<Checkbox
											checked={filters.stages.includes(item.id)}
											id={`stage-${item.id}`}
											onCheckedChange={() => toggleFilter('stages', item.id)}
										/>
										<Label className="font-normal text-sm" htmlFor={`stage-${item.id}`}>
											{item.label}
										</Label>
									</div>
								))}
							</div>
						</div>

						<Separator />

						{/* Origem */}
						<div className="space-y-2">
							<h5 className="font-medium text-muted-foreground text-sm">Origem</h5>
							<div className="grid grid-cols-2 gap-2">
								{[
									{ id: 'instagram', label: 'Instagram' },
									{ id: 'whatsapp', label: 'WhatsApp' },
									{ id: 'trafego_pago', label: 'Tráfego' },
									{ id: 'landing_page', label: 'Site' },
								].map((item) => (
									<div className="flex items-center space-x-2" key={item.id}>
										<Checkbox
											checked={filters.source.includes(item.id)}
											id={`src-${item.id}`}
											onCheckedChange={() => toggleFilter('source', item.id)}
										/>
										<Label className="font-normal text-sm" htmlFor={`src-${item.id}`}>
											{item.label}
										</Label>
									</div>
								))}
							</div>
						</div>

						<Separator />

						{/* Etiquetas */}
						<div className="space-y-2">
							<h5 className="font-medium text-muted-foreground text-sm">Etiquetas</h5>
							<div className="grid grid-cols-2 gap-2">
								{tags?.map((tag: Doc<'tags'>) => (
									<div className="flex items-center space-x-2" key={tag._id}>
										<Checkbox
											checked={filters.tags?.includes(tag._id)}
											id={`tag-${tag._id}`}
											onCheckedChange={() => toggleFilter('tags', tag._id)}
										/>
										<Label
											className="flex items-center gap-2 font-normal text-sm"
											htmlFor={`tag-${tag._id}`}
										>
											<div
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: tag.color || '#ccc' }}
											/>
											{tag.displayName || tag.name}
										</Label>
									</div>
								))}
								{(!tags || tags.length === 0) && (
									<p className="col-span-2 text-muted-foreground text-xs italic">
										Nenhuma etiqueta encontrada.
									</p>
								)}
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>

			{activeFiltersCount > 0 && (
				<Button onClick={clearFilters} size="icon" title="Limpar filtros" variant="ghost">
					<X className="h-4 w-4 text-muted-foreground" />
				</Button>
			)}
		</div>
	);
}
