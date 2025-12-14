'use client';

import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, User } from 'lucide-react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ConversationListProps {
	selectedId: Id<'conversations'> | null;
	onSelect: (id: Id<'conversations'>) => void;
	statusFilter?: string;
}

const statusColors: Record<string, string> = {
	aguardando_atendente: 'bg-yellow-500',
	em_atendimento: 'bg-green-500',
	aguardando_cliente: 'bg-blue-500',
	resolvido: 'bg-gray-500',
	bot_ativo: 'bg-purple-500',
};

export function ConversationList({ selectedId, onSelect, statusFilter }: ConversationListProps) {
	const conversations = useQuery(api.conversations.listConversations, {
		status: statusFilter,
	});

	if (!conversations) {
		return (
			<div className="space-y-2 p-4">
				{[1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />
				))}
			</div>
		);
	}

	if (conversations.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
				<MessageSquare className="h-12 w-12 mb-4 opacity-50" />
				<p>Nenhuma conversa encontrada</p>
			</div>
		);
	}

	return (
		<ScrollArea className="h-[calc(100vh-200px)]">
			<div className="space-y-1 p-2">
				{conversations.map((conversation) => (
					<button
						key={conversation._id}
						type="button"
						onClick={() => onSelect(conversation._id)}
						className={cn(
							'w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50',
							selectedId === conversation._id && 'bg-muted',
						)}
					>
						<div className="flex items-start gap-3">
							<div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
								<User className="h-5 w-5 text-white" />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<span className="font-medium text-sm truncate">
										{conversation.channel} - {conversation.department}
									</span>
									<span className="text-xs text-muted-foreground">
										{formatDistanceToNow(conversation.lastMessageAt, {
											addSuffix: false,
											locale: ptBR,
										})}
									</span>
								</div>
								<p className="text-xs text-muted-foreground truncate mt-0.5">
									{conversation.status.replace(/_/g, ' ')}
								</p>
								<div className="flex items-center gap-2 mt-1">
									<Badge variant="outline" className="text-xs py-0 px-1.5">
										{conversation.channel}
									</Badge>
									<div
										className={cn(
											'w-2 h-2 rounded-full',
											statusColors[conversation.status] || 'bg-gray-400',
										)}
									/>
								</div>
							</div>
						</div>
					</button>
				))}
			</div>
		</ScrollArea>
	);
}
