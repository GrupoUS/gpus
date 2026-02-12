'use client';

import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';

import { trpc } from '../../../lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { conversationStatusLabels } from '@/lib/constants';

interface StudentConversationsTabProps {
	studentId: number;
}

export function StudentConversationsTab({ studentId }: StudentConversationsTabProps) {
	// TODO: Add studentId filter to conversations.list when backend supports it
	void studentId;
	const { data: conversationsResult } = trpc.conversations.list.useQuery({});

	if (!conversationsResult) {
		return (
			<div className="space-y-3">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardContent className="p-4">
							<div className="flex items-start justify-between">
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-3 w-32" />
								</div>
								<div className="space-y-1 text-right">
									<Skeleton className="ml-auto h-5 w-20" />
									<Skeleton className="ml-auto h-3 w-16" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const conversations = conversationsResult.data;

	if (conversations.length === 0) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				<MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
				<p>Nenhuma conversa registrada</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{conversations.map((conv) => (
				<Link className="block" key={conv.id} search={{ conversationId: conv.id }} to="/chat">
					<Card className="cursor-pointer transition-colors hover:bg-muted/50">
						<CardContent className="p-4">
							<div className="flex items-start justify-between">
								<div>
									<p className="flex items-center gap-2 font-medium text-sm">
										{conv.channel === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
										{conv.department?.toUpperCase() ?? 'N/A'}
									</p>
									<p className="mt-1 text-muted-foreground text-xs">Canal: {conv.channel}</p>
								</div>
								<div className="text-right">
									<Badge variant={conv.status === 'resolvido' ? 'default' : 'secondary'}>
										{conversationStatusLabels[
											conv.status as keyof typeof conversationStatusLabels
										] || conv.status}
									</Badge>
									<p className="mt-1 text-muted-foreground text-xs">
										{conv.lastMessageAt
											? formatDistanceToNow(new Date(conv.lastMessageAt), {
													addSuffix: true,
													locale: ptBR,
												})
											: 'Sem mensagens'}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}
