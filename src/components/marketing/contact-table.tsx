import type { Id } from '@convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, RefreshCw, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

interface Contact {
	_id: Id<'emailContacts'>;
	email: string;
	firstName?: string;
	lastName?: string;
	sourceType: 'lead' | 'student';
	subscriptionStatus: 'subscribed' | 'unsubscribed' | 'pending';
	lastSyncedAt?: number;
	brevoId?: string;
}

interface ContactTableProps {
	contacts: Contact[];
	onSync: (contactId: Id<'emailContacts'>) => void;
}

function getStatusBadge(status: string) {
	switch (status) {
		case 'subscribed':
			return <Badge className="bg-green-500/10 text-green-600">Inscrito</Badge>;
		case 'unsubscribed':
			return <Badge variant="destructive">Cancelado</Badge>;
		case 'pending':
			return <Badge variant="outline">Pendente</Badge>;
		default:
			return <Badge variant="secondary">{status}</Badge>;
	}
}

function getSourceBadge(sourceType: string) {
	switch (sourceType) {
		case 'lead':
			return <Badge variant="outline">Lead</Badge>;
		case 'student':
			return <Badge className="bg-blue-500/10 text-blue-600">Aluno</Badge>;
		default:
			return <Badge variant="secondary">{sourceType}</Badge>;
	}
}

export function ContactTable({ contacts, onSync }: ContactTableProps) {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Contato</TableHead>
						<TableHead>Tipo</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Última Sincronização</TableHead>
						<TableHead className="text-right">Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{contacts.map((contact) => (
						<TableRow key={contact._id}>
							<TableCell>
								<div className="flex flex-col">
									<div className="flex items-center gap-2 font-medium">
										<User className="h-3 w-3 text-muted-foreground" />
										<span>
											{contact.firstName
												? `${contact.firstName} ${contact.lastName || ''}`
												: 'Sem Nome'}
										</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
										<Mail className="h-3 w-3" />
										{contact.email}
									</div>
								</div>
							</TableCell>
							<TableCell>{getSourceBadge(contact.sourceType)}</TableCell>
							<TableCell>{getStatusBadge(contact.subscriptionStatus)}</TableCell>
							<TableCell>
								<div className="text-sm text-muted-foreground">
									{contact.lastSyncedAt
										? formatDistanceToNow(contact.lastSyncedAt, { addSuffix: true, locale: ptBR })
										: 'Nunca'}
								</div>
								{contact.brevoId && (
									<div className="text-xs text-green-600 flex items-center gap-1 mt-1">
										<span className="w-1.5 h-1.5 rounded-full bg-green-500" />
										Sincronizado
									</div>
								)}
							</TableCell>
							<TableCell className="text-right">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onSync(contact._id)}
									title="Sincronizar com Brevo"
								>
									<RefreshCw className="h-4 w-4" />
								</Button>
							</TableCell>
						</TableRow>
					))}
					{contacts.length === 0 && (
						<TableRow>
							<TableCell colSpan={5} className="h-24 text-center">
								Nenhum contato encontrado.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
