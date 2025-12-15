'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { Loader2, Paperclip, Search, Send, Smile } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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
	const [templateSearch, setTemplateSearch] = useState('');

	// Use the specific API endpoint as per plan.
	const conversationTemplates = useQuery(api.messageTemplates.listTemplates, {});

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
		(t: any) =>
			t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
			t.content.toLowerCase().includes(templateSearch.toLowerCase()),
	);

	return (
		<form
			onSubmit={handleSubmit}
			className="border-t p-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
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

					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
								disabled={disabled}
							>
								<Smile className="h-5 w-5 text-muted-foreground" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80 p-0" align="end">
							<div className="p-3 border-b">
								<div className="relative">
									<Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
									<Input
										placeholder="Buscar modelos..."
										className="h-8 pl-8 text-xs"
										value={templateSearch}
										onChange={(e) => setTemplateSearch(e.target.value)}
									/>
								</div>
							</div>
							<ScrollArea className="h-64">
								{conversationTemplates === undefined ? (
									<div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>
								) : filteredTemplates?.length === 0 ? (
									<div className="p-4 text-center text-xs text-muted-foreground">
										Nenhum modelo encontrado
									</div>
								) : (
									<div className="p-1">
										{filteredTemplates?.map((template: any) => (
											<button
												type="button"
												key={template._id}
												className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors text-sm group"
												onClick={() => {
													handleTemplateSelect(template.content);
													setOpen(false);
												}}
											>
												<div className="flex items-center justify-between mb-1">
													<span className="font-medium text-xs">{template.title}</span>
													<Badge variant="outline" className="text-[10px] py-0 px-1">
														{template.category}
													</Badge>
												</div>
												<p className="text-xs text-muted-foreground line-clamp-2">
													{template.content}
												</p>
											</button>
										))}
									</div>
								)}
							</ScrollArea>
						</PopoverContent>
					</Popover>
				</div>

				<Button
					type="submit"
					size="icon"
					disabled={!message.trim() || isSending || disabled}
					className="shrink-0 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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
