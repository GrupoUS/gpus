import type { Id } from '@convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Edit, FileCode, RefreshCw, Trash2, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TemplateCardProps {
	template: {
		_id: Id<'emailTemplates'>;
		name: string;
		subject: string;
		category?: string;
		isActive: boolean;
		brevoTemplateId?: string | number;
		updatedAt: number;
	};
	onEdit: (id: Id<'emailTemplates'>) => void;
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

export function TemplateCard({ template, onEdit, onDelete, onSync }: TemplateCardProps) {
	return (
		<Card className="group relative overflow-hidden transition-all hover:shadow-md">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg shrink-0">
							<FileCode className="h-5 w-5 text-primary" />
						</div>
						<div className="min-w-0">
							<CardTitle className="text-base truncate">{template.name}</CardTitle>
							<CardDescription className="text-xs truncate">{template.subject}</CardDescription>
						</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<span className="sr-only">Abrir menu</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									role="img"
									aria-label="Menu de opções"
								>
									<circle cx="12" cy="12" r="1" />
									<circle cx="12" cy="5" r="1" />
									<circle cx="12" cy="19" r="1" />
								</svg>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(template._id)}>
								<Edit className="mr-2 h-4 w-4" />
								Editar
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onSync(template._id)}>
								<RefreshCw className="mr-2 h-4 w-4" />
								Sincronizar com Brevo
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => onDelete(template._id)}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Excluir
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-center gap-2 flex-wrap">
					{template.category && (
						<Badge variant="secondary" className="text-xs">
							{categoryLabels[template.category] || template.category}
						</Badge>
					)}
					<Badge
						variant={template.isActive ? 'default' : 'outline'}
						className={`text-xs ${template.isActive ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}`}
					>
						{template.isActive ? (
							<>
								<CheckCircle className="mr-1 h-3 w-3" />
								Ativo
							</>
						) : (
							<>
								<XCircle className="mr-1 h-3 w-3" />
								Inativo
							</>
						)}
					</Badge>
					{template.brevoTemplateId && (
						<Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
							Brevo
						</Badge>
					)}
				</div>
				<p className="text-xs text-muted-foreground">
					Atualizado {formatDistanceToNow(template.updatedAt, { addSuffix: true, locale: ptBR })}
				</p>
			</CardContent>
		</Card>
	);
}
