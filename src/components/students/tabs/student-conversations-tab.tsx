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
							<div className="flex justify-between items-start">
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-3 w-32" />
								</div>
								<div className="text-right space-y-1">
									<Skeleton className="h-5 w-20 ml-auto" />
									<Skeleton className="h-3 w-16 ml-auto" />
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
			<div className="text-center py-12 text-muted-foreground">
				<MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
				<p>Nenhuma conversa registrada</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{conversations.map((conv: Doc<'conversations'>) => (
				<Link
					key={conv._id}
					to="/chat/$conversationId"
					params={{ conversationId: conv._id }}
					className="block"
				>
					<Card className="hover:bg-muted/50 transition-colors cursor-pointer">
						<CardContent className="p-4">
							<div className="flex justify-between items-start">
								<div>
									<p className="font-medium text-sm flex items-center gap-2">
										{conv.channel === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
										{conv.department.toUpperCase()}
									</p>
									<p className="text-xs text-muted-foreground mt-1">Canal: {conv.channel}</p>
								</div>
								<div className="text-right">
									<Badge variant={conv.status === 'resolvido' ? 'default' : 'secondary'}>
										{conversationStatusLabels[conv.status] || conv.status}
									</Badge>
									<p className="text-xs text-muted-foreground mt-1">
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
