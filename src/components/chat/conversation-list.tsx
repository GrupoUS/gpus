'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ConversationListProps {
	department?: string;
	statusFilter?: string;
	search?: string;
	selectedId?: Id<'conversations'> | null;
	onSelect?: (id: Id<'conversations'> | null) => void;
}

const statusColors: Record<string, string> = {
	aguardando_atendente: 'bg-yellow-500',
	em_atendimento: 'bg-green-500',
	aguardando_cliente: 'bg-blue-500',
	resolvido: 'bg-gray-500',
	bot_ativo: 'bg-purple-500',
};

export function ConversationList({
	department,
	statusFilter,
	search,
	selectedId,
	onSelect,
}: ConversationListProps) {
	const conversations = useQuery(api.conversations.list, {
		status: statusFilter as any,
		department: (department === 'all' ? undefined : department) as any,
		search,
	});

	// We can use the params to help with styling or logic if needed, but Link handle active state well.
	// However, if we want to ensure exact highlighting, we can check the ID.
	// Fixed: Using props for controlled selection state.

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
			<div className="flex flex-col items-center justify-center p-8 text-center h-64 text-muted-foreground">
				<MessageSquare className="h-12 w-12 mb-4 opacity-50" />
				<p>Nenhuma conversa encontrada</p>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="space-y-1 p-2">
				{conversations.map((conversation) => {
					// Type assertion for enriched data that comes from the backend but isn't in the generated Doc type yet
					const item = conversation as Doc<'conversations'> & {
						contactName?: string;
						lastMessage?: { text: string };
						unreadCount?: number;
					};
					const contactName = item.contactName || 'Desconhecido';
					const initials = contactName.substring(0, 2).toUpperCase();
					const lastMessageText = item.lastMessage?.text || `${item.channel} - ${item.department}`;

					return (
						<Link
							key={item._id}
							// biome-ignore lint/suspicious/noExplicitAny: Route path dynamic
							to={`/chat/${item.department}/${item._id}` as any}
							onClick={() => onSelect?.(item._id)}
							preload="intent"
							className={cn(
								'w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 block group',
								selectedId === item._id && 'bg-muted',
							)}
						>
							<div className="flex items-start gap-3">
								<div className="shrink-0 relative">
									<div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
										{initials}
									</div>
									<div
										className={cn(
											'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
											statusColors[item.status] || 'bg-gray-400',
										)}
									/>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<span className="font-medium text-sm truncate text-foreground">
											{contactName}
										</span>
										<span className="text-xs text-muted-foreground whitespace-nowrap">
											{formatDistanceToNow(item.lastMessageAt || item._creationTime, {
												addSuffix: false,
												locale: ptBR,
											})}
										</span>
									</div>
									<p className="text-xs text-muted-foreground truncate mt-0.5 group-hover:text-foreground/80 transition-colors">
										{lastMessageText}
									</p>
									<div className="mt-1 flex gap-2">
										<Badge variant="outline" className="text-[10px] px-1 h-5">
											{item.channel}
										</Badge>
									</div>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</ScrollArea>
	);
}
