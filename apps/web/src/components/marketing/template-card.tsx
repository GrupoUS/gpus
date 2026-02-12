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
		id: number;
		name: string;
		subject: string;
		category?: string;
		isActive: boolean;
		brevoTemplateId?: string | number;
		updatedAt: number;
	};
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	onSync: (id: number) => void;
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
						<div className="shrink-0 rounded-lg bg-primary/10 p-2">
							<FileCode className="h-5 w-5 text-primary" />
						</div>
						<div className="min-w-0">
							<CardTitle className="truncate text-base">{template.name}</CardTitle>
							<CardDescription className="truncate text-xs">{template.subject}</CardDescription>
						</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="h-8 w-8" size="icon" variant="ghost">
								<span className="sr-only">Abrir menu</span>
								<svg
									aria-label="Menu de opções"
									fill="none"
									height="16"
									role="img"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									viewBox="0 0 24 24"
									width="16"
									xmlns="http://www.w3.org/2000/svg"
								>
									<circle cx="12" cy="12" r="1" />
									<circle cx="12" cy="5" r="1" />
									<circle cx="12" cy="19" r="1" />
								</svg>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(template.id)}>
								<Edit className="mr-2 h-4 w-4" />
								Editar
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onSync(template.id)}>
								<RefreshCw className="mr-2 h-4 w-4" />
								Sincronizar com Brevo
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={() => onDelete(template.id)}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Excluir
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex flex-wrap items-center gap-2">
					{template.category && (
						<Badge className="text-xs" variant="secondary">
							{categoryLabels[template.category] || template.category}
						</Badge>
					)}
					<Badge
						className={`text-xs ${template.isActive ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}`}
						variant={template.isActive ? 'default' : 'outline'}
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
						<Badge className="border-blue-300 text-blue-600 text-xs" variant="outline">
							Brevo
						</Badge>
					)}
				</div>
				<p className="text-muted-foreground text-xs">
					Atualizado {formatDistanceToNow(template.updatedAt, { addSuffix: true, locale: ptBR })}
				</p>
			</CardContent>
		</Card>
	);
}
