'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck, Clock, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Message } from '@/types/api';

interface MessageBubbleProps {
	message: Message;
	isOwn: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
	enviando: <Clock className="h-3 w-3 text-muted-foreground" />,
	enviado: <Check className="h-3 w-3 text-muted-foreground" />,
	entregue: <CheckCheck className="h-3 w-3 text-muted-foreground" />,
	lido: <CheckCheck className="h-3 w-3 text-primary" />,
	falhou: <XCircle className="h-3 w-3 text-destructive" />,
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
	const isSystem = message.sender === 'system';
	const isBot = message.sender === 'bot';

	if (isSystem) {
		return (
			<div className="my-2 flex justify-center">
				<span className="rounded-full bg-muted/50 px-3 py-1 text-muted-foreground text-xs">
					{message.content}
				</span>
			</div>
		);
	}

	let bubbleColorClass = 'rounded-bl-md bg-muted';
	if (isOwn) {
		bubbleColorClass = 'rounded-br-md bg-linear-to-r from-purple-600 to-indigo-600 text-white';
	} else if (isBot) {
		bubbleColorClass = 'rounded-bl-md border border-amber-200 bg-amber-100 text-amber-900';
	}

	return (
		<div className={cn('mb-3 flex', isOwn ? 'justify-end' : 'justify-start')}>
			<div className={cn('max-w-[75%] rounded-2xl px-4 py-2 shadow-sm', bubbleColorClass)}>
				{isBot && <span className="mb-1 block font-medium text-xs opacity-75">🤖 Bot</span>}

				{message.contentType === 'image' && message.mediaUrl && (
					<img
						alt="Imagem"
						className="mb-2 h-auto w-auto max-w-full rounded-lg"
						height="300"
						src={message.mediaUrl}
						width="400"
					/>
				)}

				{message.contentType === 'audio' && message.mediaUrl && (
					<audio className="mb-2 max-w-full" controls>
						<source src={message.mediaUrl} />
						<track kind="captions" />
					</audio>
				)}

				<p className="wrap-break-word text-sm">{message.content}</p>

				<div
					className={cn('mt-1 flex items-center gap-1', isOwn ? 'justify-end' : 'justify-start')}
				>
					<span className={cn('text-xs', isOwn ? 'text-white/70' : 'text-muted-foreground')}>
						{formatDistanceToNow(message.createdAt ?? message._creationTime, {
							addSuffix: true,
							locale: ptBR,
						})}
					</span>
					{isOwn && message.status && statusIcons[message.status]}
				</div>
			</div>
		</div>
	);
}
