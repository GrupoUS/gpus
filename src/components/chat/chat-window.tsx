'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, MoreVertical, Phone, User, Video } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { ChatInput } from './chat-input';
import { MessageBubble } from './message-bubble';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatWindowProps {
	conversationId: Id<'conversations'>;
	onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	const conversation = useQuery(api.conversations.getById, { id: conversationId });
	const messages = useQuery(api.messages.getByConversation, { conversationId });
	const sendMessage = useMutation(api.messages.send);

	// Scroll to bottom on new messages
	useEffect(() => {
		if (scrollRef.current) {
			const scrollElement =
				(scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement) ||
				scrollRef.current;
			const isNearBottom =
				scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 100;

			// Only auto-scroll if user is near bottom or on first render
			if (isNearBottom || !messages || messages.length === 0) {
				scrollElement.scrollTop = scrollElement.scrollHeight;
			}
		}
	}, [messages]);

	const handleSendMessage = async (content: string) => {
		await sendMessage({
			conversationId,
			content,
			contentType: 'text',
		});
	};

	if (conversation === undefined) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
			</div>
		);
	}

	if (conversation === null) {
		return (
			<div className="flex items-center justify-center h-full text-muted-foreground">
				Conversa não encontrada
			</div>
		);
	}

	// Safety check for contactName if existing, else use channel
	const contactName = (conversation as any).contactName;
	const displayName = contactName || conversation.channel;

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header */}
			<div className="border-b px-4 py-3 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{onBack && (
							<Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
								<ArrowLeft className="h-5 w-5" />
							</Button>
						)}
						<div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
							<User className="h-5 w-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="font-semibold text-sm">{displayName}</h3>
								<Badge variant="secondary" className="text-[10px] h-5 px-1 capitalize">
									{conversation.department}
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground capitalize">
								{conversation.status.replace(/_/g, ' ')}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon" className="hidden sm:inline-flex">
							<Phone className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" className="hidden sm:inline-flex">
							<Video className="h-4 w-4" />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon">
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>Ver perfil</DropdownMenuItem>
								<DropdownMenuItem>Transferir conversa</DropdownMenuItem>
								<DropdownMenuItem>Resolver conversa</DropdownMenuItem>
								<DropdownMenuItem className="text-destructive">Arquivar</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>

			{/* Messages */}
			<ScrollArea ref={scrollRef} className="flex-1 p-4">
				{messages === undefined ? (
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex gap-3">
								<div className="h-12 w-48 bg-muted/20 animate-pulse rounded-lg" />
							</div>
						))}
					</div>
				) : messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-muted-foreground">
						<p>Nenhuma mensagem ainda</p>
						<p className="text-sm">Envie uma mensagem para começar</p>
					</div>
				) : (
					<div className="space-y-1 pb-4">
						{messages.map((message: Doc<'messages'>) => (
							<MessageBubble
								key={message._id}
								message={message}
								isOwn={message.sender === 'agent'}
							/>
						))}
					</div>
				)}
			</ScrollArea>

			{/* Input */}
			<ChatInput onSend={handleSendMessage} />
		</div>
	);
}
