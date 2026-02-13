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
	source: string;
	onSourceChange: (value: string) => void;
	landingPage: string;
	onLandingPageChange: (value: string) => void;
	date: DateRange | undefined;
	onDateChange: (date: DateRange | undefined) => void;
	onClear: () => void;
	sourceOptions: string[];
	landingPageOptions: string[];
}

export function LeadCaptureFilters({
	search,
	onSearchChange,
	status,
	onStatusChange,
	interest,
	onInterestChange,
	source,
	onSourceChange,
	landingPage,
	onLandingPageChange,
	date,
	onDateChange,
	onClear,
	sourceOptions,
	landingPageOptions,
}: LeadCaptureFiltersProps) {
	const hasFilters =
		search ||
		status !== 'all' ||
		interest !== 'all' ||
		source !== 'all' ||
		landingPage !== 'all' ||
		date?.from;

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
				{/* Date Filter */}
				<DatePickerWithRange date={date} setDate={onDateChange} />

				{/* Status Filter */}
				<Select onValueChange={onStatusChange} value={status}>
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
				<Select onValueChange={onInterestChange} value={interest}>
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

				{/* Source Filter */}
				<Select onValueChange={onSourceChange} value={source}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Origem" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas Origens</SelectItem>
						{sourceOptions.map((opt) => (
							<SelectItem key={opt} value={opt}>
								{opt}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Landing Page Filter */}
				<Select onValueChange={onLandingPageChange} value={landingPage}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Landing Page" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas LP's</SelectItem>
						{landingPageOptions.map((opt) => (
							<SelectItem key={opt} value={opt}>
								{opt}
							</SelectItem>
						))}
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
					{date?.from && (
						<Badge className="gap-1" variant="secondary">
							Período: {date.from.toLocaleDateString('pt-BR')}
							{date.to ? ` - ${date.to.toLocaleDateString('pt-BR')}` : ''}
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onDateChange(undefined)}
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{status !== 'all' && (
						<Badge className="gap-1" variant="secondary">
							Status: {leadStatusLabels[status] || status}
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onStatusChange('all')}
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{interest !== 'all' && (
						<Badge className="gap-1" variant="secondary">
							Interesse: {leadInterestLabels[interest] || interest}
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onInterestChange('all')}
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{source !== 'all' && (
						<Badge className="gap-1" variant="secondary">
							Origem: {source}
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onSourceChange('all')}
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{landingPage !== 'all' && (
						<Badge className="gap-1" variant="secondary">
							Landing Page: {landingPage}
							<button
								className="ml-1 hover:text-destructive"
								onClick={() => onLandingPageChange('all')}
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
