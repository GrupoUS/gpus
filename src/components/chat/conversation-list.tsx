'use client';

import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
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
}

type ConversationStatus =
	| 'aguardando_atendente'
	| 'em_atendimento'
	| 'aguardando_cliente'
	| 'resolvido'
	| 'bot_ativo';

type ConversationDepartment = 'vendas' | 'cs' | 'suporte';

const statusColors: Record<string, string> = {
	aguardando_atendente: 'bg-yellow-500',
	em_atendimento: 'bg-green-500',
	aguardando_cliente: 'bg-primary',
	resolvido: 'bg-muted-foreground',
	bot_ativo: 'bg-purple-500',
};

export function ConversationList({ department, statusFilter, search }: ConversationListProps) {
	const useQueryUnsafe = useQuery as unknown as (
		query: unknown,
		args?: unknown,
	) => Doc<'conversations'>[] | undefined;
	const apiAny = api as unknown as { conversations: { list: unknown } };
	const conversations = useQueryUnsafe(apiAny.conversations.list, {
		status: statusFilter as ConversationStatus | undefined,
		department: (department === 'all' ? undefined : department) as
			| ConversationDepartment
			| undefined,
		search,
	});

	// Navigation is now URL-driven via TanStack Router's Link component.
	// Active state styling is handled via activeProps on the Link.

	if (!conversations) {
		return (
			<div className="space-y-2 p-4">
				{[1, 2, 3, 4, 5].map((i) => (
					<div className="h-16 animate-pulse rounded-lg bg-muted/20" key={i} />
				))}
			</div>
		);
	}

	if (conversations.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center p-8 text-center text-muted-foreground">
				<MessageSquare className="mb-4 h-12 w-12 opacity-50" />
				<p>Nenhuma conversa encontrada</p>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="space-y-1 p-2">
				{conversations.map((conversation: Doc<'conversations'>) => {
					// Type assertion for enriched data that comes from the backend but isn't in the generated Doc type yet
					// Note: lastMessage is returned as a string from the backend, not an object
					const item = conversation as Doc<'conversations'> & {
						contactName?: string;
						lastMessage?: string;
						unreadCount?: number;
					};
					const contactName = item.contactName || 'Desconhecido';
					const initials = contactName.substring(0, 2).toUpperCase();
					const lastMessageText = item.lastMessage || `${item.channel} - ${item.department}`;

					return (
						<Link
							activeProps={{ className: 'bg-muted' }}
							className="group block w-full rounded-lg p-3 text-left transition-colors hover:bg-muted/50"
							key={item._id}
							params={{ department: item.department, id: item._id }}
							preload="intent"
							to="/chat/$department/$id"
						>
							<div className="flex items-start gap-3">
								<div className="relative shrink-0">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-indigo-500 font-medium text-sm text-white">
										{initials}
									</div>
									<div
										className={cn(
											'absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-background',
											statusColors[item.status] || 'bg-muted-foreground',
										)}
									/>
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-2">
										<span className="truncate font-medium text-foreground text-sm">
											{contactName}
										</span>
										<span className="whitespace-nowrap text-muted-foreground text-xs">
											{formatDistanceToNow(item.lastMessageAt || item._creationTime, {
												addSuffix: false,
												locale: ptBR,
											})}
										</span>
									</div>
									<p className="mt-0.5 truncate text-muted-foreground text-xs transition-colors group-hover:text-foreground/80">
										{lastMessageText}
									</p>
									<div className="mt-1 flex gap-2">
										<Badge className="h-5 px-1 text-[10px]" variant="outline">
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
