'use client';

import { Loader2, Paperclip, Send, Smile } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
	onSend: (message: string) => Promise<void>;
	disabled?: boolean;
	placeholder?: string;
}

export function ChatInput({
	onSend,
	disabled,
	placeholder = 'Digite sua mensagem...',
}: ChatInputProps) {
	const [message, setMessage] = useState('');
	const [isSending, setIsSending] = useState(false);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();

		if (!message.trim() || isSending || disabled) return;

		setIsSending(true);
		try {
			await onSend(message.trim());
			setMessage('');
		} finally {
			setIsSending(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div className="flex items-end gap-2">
				<Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={disabled}>
					<Paperclip className="h-5 w-5 text-muted-foreground" />
				</Button>

				<div className="flex-1 relative">
					<Textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						disabled={disabled || isSending}
						rows={1}
						className={cn(
							'min-h-[44px] max-h-[120px] resize-none pr-10',
							'focus-visible:ring-purple-500',
						)}
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
						disabled={disabled}
					>
						<Smile className="h-5 w-5 text-muted-foreground" />
					</Button>
				</div>

				<Button
					type="submit"
					size="icon"
					disabled={!message.trim() || isSending || disabled}
					className="shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
				>
					{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
				</Button>
			</div>

			<p className="text-xs text-muted-foreground mt-2 text-center">
				Pressione Enter para enviar, Shift + Enter para nova linha
			</p>
		</form>
	);
}
