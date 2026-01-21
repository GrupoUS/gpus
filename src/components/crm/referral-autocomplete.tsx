import { api } from '@convex/_generated/api';
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
	onChange: (value?: string) => void;
}

interface LeadOption {
	_id: string;
	name: string;
	phone?: string;
}

export function ReferralAutocomplete({ value, onChange }: ReferralAutocompleteProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [debouncedQuery] = useDebounce(query, 500);

	const useQueryUnsafe = useQuery as unknown as (query: unknown, args?: unknown) => unknown;
	const apiAny = api as unknown as { leads: { searchLeads: unknown; getLead: unknown } };
	const results = useQueryUnsafe(apiAny.leads.searchLeads, {
		query: debouncedQuery,
	}) as LeadOption[] | undefined;
	const selectedLead = useQueryUnsafe(apiAny.leads.getLead, value ? { leadId: value } : 'skip') as
		| LeadOption
		| undefined;

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className="w-full justify-between"
					role="combobox"
					variant="outline"
				>
					{selectedLead ? selectedLead.name : 'Selecione quem indicou...'}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0">
				<Command shouldFilter={false}>
					<CommandInput onValueChange={setQuery} placeholder="Buscar por nome..." value={query} />
					<CommandList>
						<CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
						<CommandGroup>
							{results?.map((lead) => (
								<CommandItem
									key={lead._id}
									onSelect={() => {
										onChange(lead._id);
										setOpen(false);
									}}
									value={lead.name}
								>
									<Check
										className={cn('mr-2 h-4 w-4', value === lead._id ? 'opacity-100' : 'opacity-0')}
									/>
									<div className="flex flex-col">
										<span>{lead.name}</span>
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
