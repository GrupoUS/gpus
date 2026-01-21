import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ReferralAutocompleteProps {
	value?: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

interface LeadOption {
	id: string;
	name: string;
	phone: string;
	email?: string;
}

export function ReferralAutocomplete({ value, onChange, disabled }: ReferralAutocompleteProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery] = useDebounce(searchQuery, 300);

	const useQueryUnsafe = useQuery as unknown as (query: unknown, args?: unknown) => unknown;
	const apiAny = api as unknown as { leads: { getLead: unknown; search: unknown } };

	// Fetch selected lead explicitly to show name if value is set but not in search results
	const selectedLead = useQueryUnsafe(
		apiAny.leads.getLead,
		value ? { leadId: value as Id<'leads'> } : 'skip',
	) as LeadOption | null | undefined;

	// Search leads
	const searchResults = useQueryUnsafe(apiAny.leads.search, {
		query: debouncedQuery,
		limit: 10,
	}) as LeadOption[] | undefined;

	let displayValue = 'Selecione quem indicou (opcional)';
	if (value && !selectedLead) {
		displayValue = 'Carregando...';
	} else if (selectedLead) {
		displayValue = `${selectedLead.name} (${selectedLead.phone})`;
	}

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className="w-full justify-between font-normal"
					disabled={disabled}
					role="combobox"
					variant="outline"
				>
					<span className={cn('truncate', !value && 'text-muted-foreground')}>{displayValue}</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[300px] p-0">
				<Command shouldFilter={false}>
					<CommandInput
						onValueChange={setSearchQuery}
						placeholder="Buscar por nome ou telefone..."
						value={searchQuery}
					/>
					<CommandList>
						<CommandEmpty>
							{debouncedQuery.length < 2 ? 'Digite para buscar...' : 'Nenhum lead encontrado.'}
						</CommandEmpty>
						<CommandGroup>
							{searchResults?.map((lead) => (
								<CommandItem
									key={lead.id}
									onSelect={(currentValue) => {
										onChange(currentValue === value ? '' : currentValue);
										setOpen(false);
									}}
									value={lead.id}
								>
									<Check
										className={cn('mr-2 h-4 w-4', value === lead.id ? 'opacity-100' : 'opacity-0')}
									/>
									<div className="flex flex-col">
										<span className="font-medium">{lead.name}</span>
										<span className="text-muted-foreground text-xs">{lead.phone}</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
