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
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface ReferralAutocompleteProps {
	value?: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export function ReferralAutocomplete({ value, onChange, disabled }: ReferralAutocompleteProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery] = useDebounce(searchQuery, 300);

	// Fetch selected lead by ID
	const { data: selectedLead } = trpc.leads.get.useQuery(
		{ id: Number(value) },
		{ enabled: !!value },
	);

	// Search leads — TODO: Add a dedicated leads.search procedure for better performance
	const { data: searchData } = trpc.leads.list.useQuery(
		{},
		{ enabled: open && debouncedQuery.length >= 2 },
	);
	const searchResults = searchData?.data;

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
									// @ts-expect-error - Migration: error TS2322
									value={lead.id}
								>
									<Check
										// @ts-expect-error - Migration: error TS2367
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
