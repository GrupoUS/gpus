import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Tag {
	_id: Id<'tags'>;
	name: string;
	color: string;
}

interface TagAutocompleteProps {
	leadId: Id<'leads'>;
	onTagAdded?: () => void;
}

export function TagAutocomplete({ leadId, onTagAdded }: TagAutocompleteProps) {
	const [open, setOpen] = useState(false);
	const [selectedValue] = useState('');
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [newTagColor, setNewTagColor] = useState('#2563eb');

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	// biome-ignore lint/suspicious/noExplicitAny: Required to break deep type inference chain
	const tags = useQuery((api as any).tags.searchTags, { query: debouncedSearch }) as
		| Tag[]
		| undefined;
	// biome-ignore lint/suspicious/noExplicitAny: Required to break deep type inference chain
	const createTag = useMutation((api as any).tags.createTag);
	// biome-ignore lint/suspicious/noExplicitAny: Required to break deep type inference chain
	const addTagToLead = useMutation((api as any).tags.addTagToLead);
	const [isCreating, setIsCreating] = useState(false);

	const handleCreateTag = async () => {
		if (!search) return;

		setIsCreating(true);
		try {
			const tagId = await createTag({ name: search, color: newTagColor });
			await addTagToLead({ leadId, tagId });
			toast.success('Tag criada e adicionada com sucesso');
			setOpen(false);
			setSearch('');
			onTagAdded?.();
		} catch (_error) {
			toast.error('Erro ao criar tag');
		} finally {
			setIsCreating(false);
		}
	};

	const handleSelectTag = async (tagId: Id<'tags'>) => {
		try {
			await addTagToLead({ leadId, tagId });
			toast.success('Tag adicionada com sucesso');
			setOpen(false);
			onTagAdded?.();
		} catch (_error) {
			toast.error('Erro ao adicionar tag');
		}
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className="w-[200px] justify-between"
					role="combobox"
					variant="outline"
				>
					{selectedValue
						? tags?.find((tag) => tag.name === selectedValue)?.name
						: 'Adicionar tag...'}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0">
				<Command>
					<CommandInput onValueChange={setSearch} placeholder="Buscar tag..." value={search} />
					<CommandList>
						<CommandEmpty>
							{search && (
								<div className="flex flex-col gap-2 p-2">
									<p className="text-muted-foreground text-sm">Tag não encontrada.</p>
									<div className="flex items-center gap-2">
										<Input
											className="h-8 w-8 border-none p-0"
											onChange={(e) => setNewTagColor(e.target.value)}
											type="color"
											value={newTagColor}
										/>
										<Button
											className="w-full justify-start"
											disabled={isCreating}
											onClick={handleCreateTag}
											size="sm"
											variant="secondary"
										>
											{isCreating ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<Plus className="mr-2 h-4 w-4" />
											)}
											Criar "{search}"
										</Button>
									</div>
								</div>
							)}
						</CommandEmpty>
						<CommandGroup>
							{tags?.map((tag) => (
								<CommandItem
									key={tag._id}
									onSelect={() => handleSelectTag(tag._id)}
									value={tag.name}
								>
									<div
										className="mr-2 h-2 w-2 rounded-full"
										style={{ backgroundColor: tag.color }}
									/>
									{tag.name}
									<Check
										className={cn(
											'ml-auto h-4 w-4',
											selectedValue === tag.name ? 'opacity-100' : 'opacity-0',
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
