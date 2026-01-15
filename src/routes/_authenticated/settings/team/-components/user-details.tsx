import { Clock, Shield, Trash2, UserCog } from 'lucide-react';

import type { Doc } from '../../../../../../convex/_generated/dataModel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserDetailsProps {
	user: Doc<'users'> | null;
	onClose: () => void;
	onEditRole: (user: Doc<'users'>) => void;
	onRemove: (user: Doc<'users'>) => void;
}

export function UserDetailsDrawer({ user, onClose, onEditRole, onRemove }: UserDetailsProps) {
	if (!user) return null;

	return (
		<Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-[400px] sm:w-[540px]">
				<SheetHeader className="mb-6">
					<SheetTitle>Detalhes do Membro</SheetTitle>
				</SheetHeader>

				<div className="flex flex-col items-center mb-8">
					<Avatar className="h-24 w-24 mb-4">
						<AvatarFallback className="text-2xl">
							{user.name.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<h2 className="text-xl font-bold">{user.name}</h2>
					<p className="text-muted-foreground">{user.email}</p>
					<div className="flex gap-2 mt-3">
						<Badge variant="outline">{user.role}</Badge>
						<Badge variant={user.isActive ? 'default' : 'secondary'}>
							{user.isActive ? 'Ativo' : 'Inativo'}
						</Badge>
					</div>
				</div>

				<Tabs defaultValue="info">
					<TabsList className="w-full mb-4">
						<TabsTrigger value="info" className="flex-1">
							Informações
						</TabsTrigger>
						<TabsTrigger value="audit" className="flex-1">
							Auditoria
						</TabsTrigger>
					</TabsList>

					<TabsContent value="info" className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<span className="text-xs text-muted-foreground flex items-center gap-1">
									<Clock className="h-3 w-3" />
									Criado em
								</span>
								<p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
							</div>
							<div className="space-y-1">
								<span className="text-xs text-muted-foreground flex items-center gap-1">
									<Shield className="h-3 w-3" />
									ID do Sistema
								</span>
								<p className="font-mono text-xs truncate" title={user._id}>
									{user._id}
								</p>
							</div>
						</div>

						<div className="pt-4 border-t space-y-3">
							<h3 className="font-semibold mb-2">Ações</h3>
							<Button
								variant="outline"
								className="w-full justify-start gap-2"
								onClick={() => onEditRole(user)}
							>
								<UserCog className="h-4 w-4" />
								Alterar Função
							</Button>
							<Button
								variant="destructive"
								className="w-full justify-start gap-2"
								onClick={() => onRemove(user)}
							>
								<Trash2 className="h-4 w-4" />
								Remover Membro
							</Button>
						</div>
					</TabsContent>

					<TabsContent value="audit">
						<div className="rounded-md border p-4 bg-muted/50 text-center text-muted-foreground text-sm">
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
