import { Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

import { Badge } from '@/components/ui/badge';
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

interface TagSelectorProps {
	leadId: number;
	readOnly?: boolean;
}

export function TagSelector({ leadId, readOnly = false }: TagSelectorProps) {
	// Queries
	const { data: leadTags } = trpc.tags.getLeadTags.useQuery({ leadId });

	// Mutations
	const utils = trpc.useUtils();
	const addTag = trpc.tags.addTagToLead.useMutation({
		onSuccess: () => utils.tags.getLeadTags.invalidate({ leadId }),
	});
	const removeTag = trpc.tags.removeTagFromLead.useMutation({
		onSuccess: () => utils.tags.getLeadTags.invalidate({ leadId }),
	});

	// Search State
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [debouncedQuery] = useDebounce(query, 300);

	const { data: searchResults } = trpc.tags.searchTags.useQuery(
		{ query: debouncedQuery },
		{ enabled: open },
	);

	const handleAddTag = async (tagId: number) => {
		try {
			await addTag.mutateAsync({ leadId, tagId });
			toast.success('Tag adicionada');
			setOpen(false);
			setQuery('');
		} catch (error) {
			toast.error('Erro ao adicionar tag');
			// biome-ignore lint/suspicious/noConsole: Expected error logging
			console.error(error);
		}
	};

	const handleRemoveTag = async (tagId: number) => {
		try {
			await removeTag.mutateAsync({ leadId, tagId });
			toast.success('Tag removida');
		} catch (error) {
			toast.error('Erro ao remover tag');
			// biome-ignore lint/suspicious/noConsole: Expected error logging
			console.error(error);
		}
	};

	if (readOnly) {
		if (!leadTags || leadTags.length === 0) return null;
		return (
			<div className="flex flex-wrap gap-2">
				{leadTags.map((tag) => (
					<Badge
						className="border-transparent"
						key={tag.id}
						style={{
							backgroundColor: tag.color ? `${tag.color}20` : undefined,
							color: tag.color ?? undefined,
						}}
						variant="secondary"
					>
						{tag.displayName || tag.name}
					</Badge>
				))}
			</div>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			{/* Existing Tags */}
			{leadTags?.map((tag) => (
				<Badge
					className="flex items-center gap-1 border-transparent pr-1 pl-2 transition-colors hover:bg-secondary/80"
					key={tag.id}
					style={{
						backgroundColor: tag.color ? `${tag.color}20` : undefined,
						color: tag.color ?? undefined,
					}}
					variant="secondary"
				>
					{tag.displayName || tag.name}
					<button
						className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
						onClick={() => handleRemoveTag(tag.id)}
						type="button"
					>
						<X className="h-3 w-3" />
						<span className="sr-only">Remover {tag.name}</span>
					</button>
				</Badge>
			))}

			{/* Add Tag Popover */}
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<Button
						className="h-6 gap-1 rounded-full px-2 text-xs"
						disabled={readOnly}
						size="sm"
						variant="outline"
					>
						<Plus className="h-3 w-3" />
						Adicionar Tag
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="p-0">
					<Command shouldFilter={false}>
						<CommandInput onValueChange={setQuery} placeholder="Buscar tag..." value={query} />
						<CommandList>
							<CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
							<CommandGroup>
								{searchResults?.map((tag) => {
									const isSelected = leadTags?.some((t) => t.id === tag.id);
									return (
										<CommandItem
											className="flex items-center gap-2"
											disabled={isSelected}
											key={tag.id}
											onSelect={() => !isSelected && handleAddTag(tag.id)}
											value={tag.name}
										>
											<div
												className="h-3 w-3 rounded-full"
												style={{ backgroundColor: tag.color || '#ccc' }}
											/>
											{tag.displayName || tag.name}
											{isSelected && <Check className="ml-auto h-4 w-4 opacity-50" />}
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
