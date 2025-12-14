'use client';

import { useQuery } from 'convex/react';
import { FileText, Hash, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TemplatePickerProps {
	onSelect: (template: Doc<'messageTemplates'>) => void;
	trigger?: React.ReactNode;
}

const categoryLabels: Record<string, string> = {
	abertura: 'Abertura',
	qualificacao: 'Qualificação',
	apresentacao: 'Apresentação',
	objecoes: 'Objeções',
	fechamento: 'Fechamento',
	follow_up: 'Follow-up',
	pos_venda: 'Pós-venda',
	suporte: 'Suporte',
};

const categoryIcons: Record<string, React.ReactNode> = {
	abertura: <Sparkles className="h-4 w-4" />,
	qualificacao: <Hash className="h-4 w-4" />,
	apresentacao: <FileText className="h-4 w-4" />,
};

export function TemplatePicker({ onSelect, trigger }: TemplatePickerProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const templates = useQuery(api.messageTemplates?.listTemplates, {});

	const filteredTemplates = templates?.filter((t: Doc<'messageTemplates'>) => {
		const matchesSearch =
			t.name.toLowerCase().includes(search.toLowerCase()) ||
			t.content.toLowerCase().includes(search.toLowerCase());
		const matchesCategory = !selectedCategory || t.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const categories = templates
		? [...new Set(templates.map((t: Doc<'messageTemplates'>) => t.category))]
		: [];

	const handleSelect = (template: Doc<'messageTemplates'>) => {
		onSelect(template);
		setOpen(false);
		setSearch('');
		setSelectedCategory(null);
	};

	// Assuming CategoryIcon is a component type (e.g., from lucide-react)
	// and needs to be dynamically determined or passed.
	// For the purpose of this specific change, we'll define a placeholder
	// if it's not meant to be dynamic for the trigger button.
	// If the intent is to use a specific icon like FileText, it should be directly used.
	// If it's meant to be dynamic, more context is needed for its definition.
	// Based on the instruction, we'll assume CategoryIcon is a component type variable.
	// For this specific button, the original icon was FileText.
	// If CategoryIcon is meant to replace FileText, it needs to be defined.
	// Let's assume for now that CategoryIcon is meant to be FileText if not dynamic.
	const CategoryIcon = FileText; // Placeholder based on original icon

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm" className="gap-2">
						{CategoryIcon && <CategoryIcon className="h-4 w-4" />}
						Templates
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Selecionar Template</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar templates..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Categories */}
					<div className="flex flex-wrap gap-2">
						<Button
							variant={selectedCategory === null ? 'default' : 'outline'}
							size="sm"
							onClick={() => setSelectedCategory(null)}
						>
							Todos
						</Button>
						{categories.map((cat) => (
							<Button
								key={cat}
								variant={selectedCategory === cat ? 'default' : 'outline'}
								size="sm"
								onClick={() => setSelectedCategory(cat)}
								className="gap-1"
							>
								{categoryIcons[cat as keyof typeof categoryIcons]}
								{categoryLabels[cat as keyof typeof categoryLabels] || cat}
							</Button>
						))}
					</div>

					{/* Templates list */}
					<ScrollArea className="h-[300px]">
						{!templates ? (
							<div className="space-y-2">
								{[1, 2, 3].map((i) => (
									<div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />
								))}
							</div>
						) : filteredTemplates?.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>Nenhum template encontrado</p>
							</div>
						) : (
							<div className="space-y-2">
								{filteredTemplates?.map((template) => (
									<button
										key={template._id}
										type="button"
										onClick={() => handleSelect(template)}
										className={cn(
											'w-full text-left p-3 rounded-lg border transition-colors',
											'hover:bg-muted/50 hover:border-primary/50',
										)}
									>
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<h4 className="font-medium text-sm">{template.name}</h4>
												<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
													{template.content}
												</p>
											</div>
											<Badge variant="outline" className="shrink-0 text-xs">
												{categoryLabels[template.category as keyof typeof categoryLabels] ||
													template.category}
											</Badge>
										</div>
									</button>
								))}
							</div>
						)}
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}
