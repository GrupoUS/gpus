'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { Loader2, Paperclip, Search, Send, Smile } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useChatContext } from '@/routes/_authenticated/chat';

interface MessageTemplate {
	_id: string;
	name: string;
	content: string;
	category: string;
}

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
	const [templateSearch, setTemplateSearch] = useState('');
	const { pendingMessage, setPendingMessage } = useChatContext();

	// Listen for pending messages from AI Assistant
	useEffect(() => {
		if (pendingMessage) {
			setMessage((prev) => (prev ? `${prev}\n${pendingMessage}` : pendingMessage));
			// Clear pending message after picking it up
			setPendingMessage('');
		}
	}, [pendingMessage, setPendingMessage]);

	const useQueryUnsafe = useQuery as unknown as (
		query: unknown,
		args?: unknown,
	) => MessageTemplate[] | undefined;
	const apiAny = api as unknown as { messageTemplates: { listTemplates: unknown } };
	const conversationTemplates = useQueryUnsafe(apiAny.messageTemplates.listTemplates, {});

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
			void handleSubmit();
		}
	};

	const handleTemplateSelect = (content: string) => {
		setMessage((prev) => (prev ? `${prev}\n${content}` : content));
		setOpen(false);
	};

	const [open, setOpen] = useState(false);

	const filteredTemplates = conversationTemplates?.filter(
		(t: MessageTemplate) =>
			t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
			t.content.toLowerCase().includes(templateSearch.toLowerCase()),
	);

	let templateListContent: ReactNode = null;
	if (conversationTemplates === undefined) {
		templateListContent = (
			<div className="p-4 text-center text-muted-foreground text-xs">Carregando...</div>
		);
	} else if (filteredTemplates?.length === 0) {
		templateListContent = (
			<div className="p-4 text-center text-muted-foreground text-xs">Nenhum modelo encontrado</div>
		);
	} else {
		templateListContent = (
			<div className="p-1">
				{filteredTemplates?.map((template: MessageTemplate) => (
					<button
						className="group w-full rounded-md p-2 text-left text-sm transition-colors hover:bg-muted"
						key={template._id}
						onClick={() => {
							handleTemplateSelect(template.content);
							setOpen(false);
						}}
						type="button"
					>
						<div className="mb-1 flex items-center justify-between">
							<span className="font-medium text-xs">{template.name}</span>
							<Badge className="px-1 py-0 text-[10px]" variant="outline">
								{template.category}
							</Badge>
						</div>
						<p className="line-clamp-2 text-muted-foreground text-xs">{template.content}</p>
					</button>
				))}
			</div>
		);
	}

	return (
		<form
			className="border-t bg-background/95 p-4 backdrop-blur supports-backdrop-filter:bg-background/60"
			onSubmit={handleSubmit}
		>
			<div className="flex items-end gap-2">
				<Button className="shrink-0" disabled={disabled} size="icon" type="button" variant="ghost">
					<Paperclip className="h-5 w-5 text-muted-foreground" />
				</Button>

				<div className="relative flex-1">
					<Textarea
						className={cn(
							'max-h-[120px] min-h-[44px] resize-none pr-10',
							'focus-visible:ring-purple-500',
						)}
						disabled={disabled || isSending}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						rows={1}
						value={message}
					/>

					<Popover onOpenChange={setOpen} open={open}>
						<PopoverTrigger asChild>
							<Button
								className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
								disabled={disabled}
								size="icon"
								type="button"
								variant="ghost"
							>
								<Smile className="h-5 w-5 text-muted-foreground" />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-80 p-0">
							<div className="border-b p-3">
								<div className="relative">
									<Search className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
									<Input
										className="h-8 pl-8 text-xs"
										onChange={(e) => setTemplateSearch(e.target.value)}
										placeholder="Buscar modelos..."
										value={templateSearch}
									/>
								</div>
							</div>
							<ScrollArea className="h-64">{templateListContent}</ScrollArea>
						</PopoverContent>
					</Popover>
				</div>

				<Button
					className="shrink-0 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
					disabled={!message.trim() || isSending || disabled}
					size="icon"
					type="submit"
				>
					{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
				</Button>
			</div>

			<p className="mt-2 text-center text-muted-foreground text-xs">
				Pressione Enter para enviar, Shift + Enter para nova linha
			</p>
		</form>
	);
}
