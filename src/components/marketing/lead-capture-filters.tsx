'use client';

import { Search, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { leadInterestLabels, leadStatusLabels } from '@/lib/constants';

interface LeadCaptureFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	status: string;
	onStatusChange: (value: string) => void;
	interest: string;
	onInterestChange: (value: string) => void;
	date: DateRange | undefined;
	onDateChange: (date: DateRange | undefined) => void;
	onClear: () => void;
}

export function LeadCaptureFilters({
	search,
	onSearchChange,
	status,
	onStatusChange,
	interest,
	onInterestChange,
	date,
	onDateChange,
	onClear,
}: LeadCaptureFiltersProps) {
	const hasFilters = search || status !== 'all' || interest !== 'all' || date?.from;

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
				{/* Date Filter */}
				<DatePickerWithRange date={date} setDate={onDateChange} />

				{/* Status Filter */}
				<Select value={status} onValueChange={onStatusChange}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos Status</SelectItem>
						{Object.entries(leadStatusLabels).map(([key, label]) => (
							<SelectItem key={key} value={key}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Interest Filter */}
				<Select value={interest} onValueChange={onInterestChange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Interesse" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos Interesses</SelectItem>
						{Object.entries(leadInterestLabels).map(([key, label]) => (
							<SelectItem key={key} value={key}>
								{label}
							</SelectItem>
						))}
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
					{date?.from && (
						<Badge variant="secondary" className="gap-1">
							Período: {date.from.toLocaleDateString('pt-BR')}
							{date.to ? ` - ${date.to.toLocaleDateString('pt-BR')}` : ''}
							<button
								type="button"
								onClick={() => onDateChange(undefined)}
								className="ml-1 hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{status !== 'all' && (
						<Badge variant="secondary" className="gap-1">
							Status: {leadStatusLabels[status] || status}
							<button
								type="button"
								onClick={() => onStatusChange('all')}
								className="ml-1 hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{interest !== 'all' && (
						<Badge variant="secondary" className="gap-1">
							Interesse: {leadInterestLabels[interest] || interest}
							<button
								type="button"
								onClick={() => onInterestChange('all')}
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
