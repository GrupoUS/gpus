'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { conversationStatusLabels } from '@/lib/constants';

interface StudentConversationsTabProps {
	studentId: Id<'students'>;
}

export function StudentConversationsTab({ studentId }: StudentConversationsTabProps) {
	const conversations = useQuery(api.conversations.getByStudent, { studentId });

	if (!conversations) {
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
			{conversations.map((conv: Doc<'conversations'>) => (
				<Link className="block" key={conv._id} search={{ conversationId: conv._id }} to="/chat">
					<Card className="cursor-pointer transition-colors hover:bg-muted/50">
						<CardContent className="p-4">
							<div className="flex items-start justify-between">
								<div>
									<p className="flex items-center gap-2 font-medium text-sm">
										{conv.channel === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
										{conv.department.toUpperCase()}
									</p>
									<p className="mt-1 text-muted-foreground text-xs">Canal: {conv.channel}</p>
								</div>
								<div className="text-right">
									<Badge variant={conv.status === 'resolvido' ? 'default' : 'secondary'}>
										{conversationStatusLabels[conv.status] || conv.status}
									</Badge>
									<p className="mt-1 text-muted-foreground text-xs">
										{formatDistanceToNow(conv.lastMessageAt, {
											addSuffix: true,
											locale: ptBR,
										})}
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
