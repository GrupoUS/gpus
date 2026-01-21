import {
	ChevronDown,
	ChevronUp,
	FileText,
	MessageSquare,
	Send,
	Sparkles,
	Wand,
} from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';

import type { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDifyChat } from '@/hooks/use-dify-chat';
import { cn } from '@/lib/utils';
import { useChatContext } from '@/routes/_authenticated/chat';

interface AIChatWidgetProps {
	conversationId?: Id<'conversations'> | null; // Allow null to handle "no conversation selected"
	onInsertResponse?: (text: string) => void;
}

export function AIChatWidget({
	conversationId: _conversationId,
	onInsertResponse,
}: AIChatWidgetProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [inputText, setInputText] = useState('');
	const { messages, sendMessage, isLoading } = useDifyChat();
	const { setPendingMessage } = useChatContext();

	const handleSend = async () => {
		if (!inputText.trim() || isLoading) return;
		const text = inputText;
		setInputText('');
		const assistantResponse = await sendMessage(text);
		// Invoke the callback with the assistant response if available
		if (assistantResponse) {
			if (onInsertResponse) {
				onInsertResponse(assistantResponse);
			}
			// Also set pending message in context for ChatInput to pick up
			setPendingMessage(assistantResponse);
		}
	};

	const handleQuickAction = (action: 'generate' | 'summarize' | 'template') => {
		let prompt = '';
		switch (action) {
			case 'generate':
				prompt = 'Gere uma resposta profissional para a última mensagem do cliente';
				break;
			case 'summarize':
				prompt = 'Resuma esta conversa em 3 pontos principais';
				break;
			case 'template':
				prompt = 'Sugira um template de mensagem adequado para esta situação';
				break;
			default:
				prompt = '';
				break;
		}
		setInputText(prompt);
		// Focus logic would go here if we had a ref to input
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			void handleSend();
		}
	};

	// Widget renders regardless of conversationId - parent controls visibility
	// This allows the widget to be used for general AI assistance

	return (
		<div className="border-border border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<Collapsible className="w-full" onOpenChange={setIsOpen} open={isOpen}>
				<CollapsibleTrigger asChild>
					<div className="flex cursor-pointer items-center justify-between border-border/50 border-b bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-2 hover:bg-muted/50">
						<div className="flex items-center gap-2">
							<div className="rounded-full bg-gradient-to-br from-primary to-accent p-1 shadow-sm">
								<Sparkles className="h-3 w-3 text-primary-foreground" />
							</div>
							<span className="font-medium text-foreground text-sm">Assistente IA (Dify)</span>
						</div>
						{isOpen ? (
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronUp className="h-4 w-4 text-muted-foreground" />
						)}
					</div>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<div className="space-y-4 p-4">
						{/* Message History */}
						<ScrollArea className="h-[200px] w-full pr-4">
							<div className="space-y-4">
								{messages.length === 0 ? (
									<div className="py-8 text-center text-muted-foreground text-xs">
										<p className="mb-2">👋 Olá! Sou a assistente do Grupo US.</p>
										<p>Como posso ajudar você com este atendimento hoje?</p>
									</div>
								) : (
									messages.map((msg, index) => (
										<div
											className={cn(
												'flex max-w-[85%] flex-col text-sm',
												msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start',
											)}
											key={index}
										>
											<div
												className={cn(
													'rounded-lg px-3 py-2',
													msg.role === 'user'
														? 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
														: 'bg-muted text-foreground',
												)}
											>
												{msg.content}
											</div>
											<span className="mt-1 text-[10px] text-muted-foreground">
												{msg.timestamp.toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit',
												})}
											</span>
										</div>
									))
								)}
								{/* Loading State */}
								{isLoading && (
									<div className="mr-auto flex items-center gap-1.5 p-2">
										<div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
										<div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
										<div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
									</div>
								)}
							</div>
						</ScrollArea>

						{/* Quick Actions */}
						<div className="flex flex-wrap gap-2 border-border/50 border-t pt-2">
							<Button
								className="h-7 gap-1.5 bg-background/50 text-xs transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
								onClick={() => handleQuickAction('generate')}
								size="sm"
								variant="outline"
							>
								<Wand className="h-3 w-3" />
								Gerar resposta
							</Button>
							<Button
								className="h-7 gap-1.5 bg-background/50 text-xs transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
								onClick={() => handleQuickAction('summarize')}
								size="sm"
								variant="outline"
							>
								<FileText className="h-3 w-3" />
								Resumir conversa
							</Button>
							<Button
								className="h-7 gap-1.5 bg-background/50 text-xs transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
								onClick={() => handleQuickAction('template')}
								size="sm"
								variant="outline"
							>
								<MessageSquare className="h-3 w-3" />
								Sugerir template
							</Button>
						</div>

						{/* Input Area */}
						<div className="flex gap-2">
							<Input
								className="h-9 flex-1 text-sm focus-visible:ring-primary"
								disabled={isLoading}
								onChange={(e) => setInputText(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Digite sua pergunta para a IA de vendas..."
								value={inputText}
							/>
							<Button
								className={cn(
									'h-9 w-9 bg-gradient-to-br from-primary to-accent p-0 transition-all hover:from-primary/90 hover:to-accent/90',
									isLoading && 'cursor-not-allowed opacity-50',
								)}
								disabled={isLoading}
								onClick={handleSend}
								size="sm"
							>
								<Send className="h-4 w-4 text-primary-foreground" />
								<span className="sr-only">Enviar</span>
							</Button>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
