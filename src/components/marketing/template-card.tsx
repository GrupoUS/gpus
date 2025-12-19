'use client';

import type { Doc, Id } from '@convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
	Calendar,
	CheckCircle2,
	Copy,
	Edit,
	FileCode,
	MoreVertical,
	Send,
	Trash,
	XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
	template: Doc<'emailTemplates'>;
	onEdit: (id: Id<'emailTemplates'>) => void;
	onDuplicate?: (id: Id<'emailTemplates'>) => void;
	onDelete: (id: Id<'emailTemplates'>) => void;
	onSync: (id: Id<'emailTemplates'>) => void;
}

const categoryLabels: Record<string, string> = {
	newsletter: 'Newsletter',
	promocional: 'Promocional',
	transacional: 'Transacional',
	boas_vindas: 'Boas-vindas',
	outro: 'Outro',
};

export function TemplateCard({
	template,
	onEdit,
	onDuplicate,
	onDelete,
	onSync,
}: TemplateCardProps) {
	return (
		<Card className="flex flex-col h-full hover:shadow-md transition-shadow">
			<CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
						<FileCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<h3 className="font-semibold text-sm line-clamp-1" title={template.name}>
							{template.name}
						</h3>
						<div className="flex items-center gap-2 mt-1">
							{template.category && (
								<Badge variant="outline" className="text-[10px] px-1.5 h-5">
									{categoryLabels[template.category] || template.category}
								</Badge>
							)}
							<span
								className={cn(
									'text-[10px] font-medium flex items-center gap-1',
									template.isActive ? 'text-green-600' : 'text-muted-foreground',
								)}
							>
								{template.isActive ? (
									<CheckCircle2 className="h-3 w-3" />
								) : (
									<XCircle className="h-3 w-3" />
								)}
								{template.isActive ? 'Ativo' : 'Inativo'}
							</span>
						</div>
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<MoreVertical className="h-4 w-4 text-muted-foreground" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit(template._id)}>
							<Edit className="h-4 w-4 mr-2" />
							Editar
						</DropdownMenuItem>
						{onDuplicate && (
							<DropdownMenuItem onClick={() => onDuplicate(template._id)}>
								<Copy className="h-4 w-4 mr-2" />
								Duplicar
							</DropdownMenuItem>
						)}
						<DropdownMenuItem onClick={() => onSync(template._id)}>
							<Send className="h-4 w-4 mr-2" />
							Sincronizar no Brevo
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onDelete(template._id)}
							className="text-destructive focus:text-destructive"
						>
							<Trash className="h-4 w-4 mr-2" />
							Excluir
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>

			<CardContent className="p-4 pt-0 grow">
				<div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md font-mono line-clamp-2 min-h-[40px]">
					Assunto: {template.subject}
				</div>
				<div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
					<Calendar className="h-3 w-3" />
					<span>Criado {formatDistanceToNow(template.createdAt, { locale: ptBR })} atrás</span>
				</div>
			</CardContent>

			<CardFooter className="p-4 pt-0 border-t bg-muted/10">
				<div className="w-full pt-3 flex justify-between items-center text-xs">
					<div className="text-muted-foreground truncate max-w-[150px]">
						{template.brevoTemplateId ? (
							<span className="text-green-600 flex items-center gap-1">
								<CheckCircle2 className="h-3 w-3" />
								Sincronizado (ID: {template.brevoTemplateId})
							</span>
						) : (
							<span>Não sincronizado</span>
						)}
					</div>
					<Button
						variant="outline"
						size="sm"
						className="h-7 text-xs"
						onClick={() => onEdit(template._id)}
					>
						Editar
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
