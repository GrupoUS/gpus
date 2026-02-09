import { Clock, Shield, Trash2, UserCog } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserDetailsProps {
	user: Record<string, unknown> | null;
	onClose: () => void;
	onEditRole: (user: Record<string, unknown>) => void;
	onRemove: (user: Record<string, unknown>) => void;
}

export function UserDetailsDrawer({ user, onClose, onEditRole, onRemove }: UserDetailsProps) {
	if (!user) return null;

	return (
		<Sheet onOpenChange={(open) => !open && onClose()} open={!!user}>
			<SheetContent className="w-[400px] sm:w-[540px]">
				<SheetHeader className="mb-6">
					<SheetTitle>Detalhes do Membro</SheetTitle>
				</SheetHeader>

				<div className="mb-8 flex flex-col items-center">
					<Avatar className="mb-4 h-24 w-24">
						<AvatarFallback className="text-2xl">
							{user.name.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<h2 className="font-bold text-xl">{user.name}</h2>
					<p className="text-muted-foreground">{user.email}</p>
					<div className="mt-3 flex gap-2">
						<Badge variant="outline">{user.role}</Badge>
						<Badge variant={user.isActive ? 'default' : 'secondary'}>
							{user.isActive ? 'Ativo' : 'Inativo'}
						</Badge>
					</div>
				</div>

				<Tabs defaultValue="info">
					<TabsList className="mb-4 w-full">
						<TabsTrigger className="flex-1" value="info">
							Informações
						</TabsTrigger>
						<TabsTrigger className="flex-1" value="audit">
							Auditoria
						</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-6" value="info">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<span className="flex items-center gap-1 text-muted-foreground text-xs">
									<Clock className="h-3 w-3" />
									Criado em
								</span>
								<p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
							</div>
							<div className="space-y-1">
								<span className="flex items-center gap-1 text-muted-foreground text-xs">
									<Shield className="h-3 w-3" />
									ID do Sistema
								</span>
								<p className="truncate font-mono text-xs" title={user.id}>
									{user.id}
								</p>
							</div>
						</div>

						<div className="space-y-3 border-t pt-4">
							<h3 className="mb-2 font-semibold">Ações</h3>
							<Button
								className="w-full justify-start gap-2"
								onClick={() => onEditRole(user)}
								variant="outline"
							>
								<UserCog className="h-4 w-4" />
								Alterar Função
							</Button>
							<Button
								className="w-full justify-start gap-2"
								onClick={() => onRemove(user)}
								variant="destructive"
							>
								<Trash2 className="h-4 w-4" />
								Remover Membro
							</Button>
						</div>
					</TabsContent>

					<TabsContent value="audit">
						<div className="rounded-md border bg-muted/50 p-4 text-center text-muted-foreground text-sm">
							Histórico de auditoria disponível no painel global.
							<br />
							(Funcionalidade de log específico em breve)
						</div>
					</TabsContent>
				</Tabs>
			</SheetContent>
		</Sheet>
	);
}
