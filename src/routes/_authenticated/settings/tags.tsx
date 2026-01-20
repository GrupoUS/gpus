import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { Plus, Tag, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/_authenticated/settings/tags')({
	component: TagsSettingsPage,
});

function TagsSettingsPage() {
	// Queries & Mutations
	// biome-ignore lint/suspicious/noExplicitAny: Temporary cast for deeply nested API types
	const listTagsQuery = (api as any).tags.listTags;
	const tags = useQuery(listTagsQuery);

	// biome-ignore lint/suspicious/noExplicitAny: Temporary cast
	const createTagMutation = (api as any).tags.createTag;
	const createTag = useMutation(createTagMutation);

	// biome-ignore lint/suspicious/noExplicitAny: Temporary cast
	const deleteTagMutation = (api as any).tags.deleteTag;
	const deleteTag = useMutation(deleteTagMutation);

	// Local State
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [selectedTag, setSelectedTag] = useState<Doc<'tags'> | null>(null);
	const [newTagName, setNewTagName] = useState('');
	const [newTagColor, setNewTagColor] = useState('#6366f1'); // Default Indigo
	const nameInputId = useId();
	const colorInputId = useId();

	// Handlers
	const handleCreate = async () => {
		if (!newTagName.trim()) {
			toast.error('O nome da tag é obrigatório');
			return;
		}

		try {
			await createTag({
				name: newTagName,
				color: newTagColor,
			});
			toast.success('Tag criada com sucesso');
			setIsCreateOpen(false);
			setNewTagName('');
			setNewTagColor('#6366f1');
		} catch (error) {
			toast.error('Erro ao criar tag. Verifique se já existe.');
			// biome-ignore lint/suspicious/noConsole: Expected error logging
			console.error(error);
		}
	};

	const handleDelete = async () => {
		if (!selectedTag) return;

		try {
			// biome-ignore lint/suspicious/noExplicitAny: Temporary cast
			await deleteTag({ tagId: selectedTag._id as any });
			toast.success('Tag removida com sucesso');
			setIsDeleteOpen(false);
			setSelectedTag(null);
		} catch (error) {
			toast.error('Erro ao remover tag. Você tem permissão de administrador?');
			// biome-ignore lint/suspicious/noConsole: Expected error logging
			console.error(error);
		}
	};

	const openDeleteDialog = (tag: Doc<'tags'>) => {
		setSelectedTag(tag);
		setIsDeleteOpen(true);
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<Tag className="h-6 w-6 text-green-500" />
						Etiquetas
					</h1>
					<p className="text-muted-foreground">Gerencie as etiquetas para categorizar seus leads</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Nova Tag
				</Button>
			</div>

			{/* List */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Cor</TableHead>
							<TableHead>Nome</TableHead>
							<TableHead className="text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{tags && tags.length > 0 ? (
							tags.map((tag: Doc<'tags'>) => (
								<TableRow key={tag._id}>
									<TableCell>
										<div
											className="h-6 w-6 rounded-full border"
											style={{ backgroundColor: tag.color || '#ccc' }}
										/>
									</TableCell>
									<TableCell className="font-medium">{tag.name}</TableCell>
									<TableCell className="text-right">
										<Button
											className="text-red-500 hover:bg-red-50 hover:text-red-600"
											onClick={() => openDeleteDialog(tag)}
											size="icon"
											variant="ghost"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell className="h-24 text-center" colSpan={3}>
									{tags ? 'Nenhuma tag encontrada.' : 'Carregando...'}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Create Dialog */}
			<Dialog onOpenChange={setIsCreateOpen} open={isCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nova Tag</DialogTitle>
						<DialogDescription>Crie uma nova etiqueta para organizar seus leads.</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right" htmlFor={nameInputId}>
								Nome
							</Label>
							<Input
								className="col-span-3"
								id={nameInputId}
								onChange={(e) => setNewTagName(e.target.value)}
								placeholder="Ex: Cliente VIP"
								value={newTagName}
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right" htmlFor={colorInputId}>
								Cor
							</Label>
							<div className="col-span-3 flex items-center gap-2">
								<Input
									className="h-10 w-20 p-1"
									id={colorInputId}
									onChange={(e) => setNewTagColor(e.target.value)}
									type="color"
									value={newTagColor}
								/>
								<span className="text-muted-foreground text-sm">{newTagColor}</span>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => setIsCreateOpen(false)} variant="outline">
							Cancelar
						</Button>
						<Button onClick={handleCreate}>Criar Tag</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<Dialog onOpenChange={setIsDeleteOpen} open={isDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remover Tag</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja remover a tag "{selectedTag?.name}"? Esta ação removerá a tag
							de todos os leads associados.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={() => setIsDeleteOpen(false)} variant="outline">
							Cancelar
						</Button>
						<Button onClick={handleDelete} variant="destructive">
							Remover
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
