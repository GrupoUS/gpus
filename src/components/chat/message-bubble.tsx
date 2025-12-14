'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck, Clock, XCircle } from 'lucide-react';

import type { Doc } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
	message: Doc<'messages'>;
	isOwn: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
	enviando: <Clock className="h-3 w-3 text-muted-foreground" />,
	enviado: <Check className="h-3 w-3 text-muted-foreground" />,
	entregue: <CheckCheck className="h-3 w-3 text-muted-foreground" />,
	lido: <CheckCheck className="h-3 w-3 text-blue-500" />,
	falhou: <XCircle className="h-3 w-3 text-destructive" />,
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
	const isSystem = message.sender === 'system';
	const isBot = message.sender === 'bot';

	if (isSystem) {
		return (
			<div className="flex justify-center my-2">
				<span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
					{message.content}
				</span>
			</div>
		);
	}

	return (
		<div className={cn('flex mb-3', isOwn ? 'justify-end' : 'justify-start')}>
			<div
				className={cn(
					'max-w-[75%] rounded-2xl px-4 py-2 shadow-sm',
					isOwn
						? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-br-md'
						: isBot
							? 'bg-amber-100 text-amber-900 rounded-bl-md border border-amber-200'
							: 'bg-muted rounded-bl-md',
				)}
			>
				{isBot && <span className="text-xs font-medium block mb-1 opacity-75">🤖 Bot</span>}

				{message.contentType === 'image' && message.mediaUrl && (
					<img src={message.mediaUrl} alt="Imagem" className="rounded-lg max-w-full mb-2" />
				)}

				{message.contentType === 'audio' && message.mediaUrl && (
					<audio controls className="max-w-full mb-2">
						<source src={message.mediaUrl} />
						<track kind="captions" />
					</audio>
				)}

				<p className="text-sm wrap-break-word">{message.content}</p>

				<div
					className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}
				>
					<span className={cn('text-xs', isOwn ? 'text-white/70' : 'text-muted-foreground')}>
						{formatDistanceToNow(message.createdAt, {
							addSuffix: true,
							locale: ptBR,
						})}
					</span>
					{isOwn && statusIcons[message.status]}
				</div>
			</div>
		</div>
	);
}
