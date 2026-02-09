'use client';

import { ArrowLeft, MoreVertical, Phone, User, Video } from 'lucide-react';
import type { ReactNode } from 'react';
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
import type { Conversation } from '@/types/api';

interface ChatWindowProps {
	onBack?: () => void;
	conversation: Conversation | null | undefined;
	messages: Conversation[] | undefined;
	onSendMessage: (content: string) => Promise<void>;
}

export function ChatWindow({ conversation, messages, onBack, onSendMessage }: ChatWindowProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

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
		if (conversation === undefined || conversation === null) {
			return;
		}
		await onSendMessage(content);
	};

	if (conversation === undefined) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (conversation === null) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				Conversa não encontrada
			</div>
		);
	}

	// Safety check for contactName if existing, else use channel
	const contactName = (conversation as { contactName?: string }).contactName;
	const displayName = contactName || conversation.channel;

	let messagesContent: ReactNode = null;
	if (messages === undefined) {
		messagesContent = (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div className="flex gap-3" key={i}>
						<div className="h-12 w-48 animate-pulse rounded-lg bg-muted/20" />
					</div>
				))}
			</div>
		);
	} else if (messages.length === 0) {
		messagesContent = (
			<div className="flex h-full flex-col items-center justify-center text-muted-foreground">
				<p>Nenhuma mensagem ainda</p>
				<p className="text-sm">Envie uma mensagem para começar</p>
			</div>
		);
	} else {
		messagesContent = (
			<div className="space-y-1 pb-4">
				{messages.map((message: Conversation) => (
					<MessageBubble isOwn={message.sender === 'agent'} key={message.id} message={message} />
				))}
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{onBack && (
							<Button className="md:hidden" onClick={onBack} size="icon" variant="ghost">
								<ArrowLeft className="h-5 w-5" />
							</Button>
						)}
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-indigo-500 text-white">
							<User className="h-5 w-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="font-semibold text-sm">{displayName}</h3>
								<Badge className="h-5 px-1 text-[10px] capitalize" variant="secondary">
									{conversation.department}
								</Badge>
							</div>
							<p className="text-muted-foreground text-xs capitalize">
								{conversation.status.replace(/_/g, ' ')}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-1">
						<Button className="hidden sm:inline-flex" size="icon" variant="ghost">
							<Phone className="h-4 w-4" />
						</Button>
						<Button className="hidden sm:inline-flex" size="icon" variant="ghost">
							<Video className="h-4 w-4" />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="icon" variant="ghost">
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
			<ScrollArea className="flex-1 p-4" ref={scrollRef}>
				{messagesContent}
			</ScrollArea>

			{/* Input */}
			<ChatInput
				disabled={conversation === undefined || conversation === null}
				onSend={handleSendMessage}
			/>
		</div>
	);
}
