import {
	ChevronDown,
	ChevronUp,
	FileText,
	MessageSquare,
	Send,
	Sparkles,
	Wand,
} from 'lucide-react';
import { useState } from 'react';

import type { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDifyChat } from '@/hooks/use-dify-chat';
import { cn } from '@/lib/utils';

interface AIChatWidgetProps {
	conversationId?: Id<'conversations'> | null; // Allow null to handle "no conversation selected"
	onInsertResponse?: (text: string) => void;
}

export function AIChatWidget({ conversationId }: AIChatWidgetProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [inputText, setInputText] = useState('');
	const { messages, sendMessage, isLoading } = useDifyChat();

	const handleSend = async () => {
		if (!inputText.trim() || isLoading) return;
		const text = inputText;
		setInputText('');
		await sendMessage(text);
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
		}
		setInputText(prompt);
		// Focus logic would go here if we had a ref to input
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			void handleSend();
		}
	};

	// Only render if a conversation is active (implied by plan "when a conversation is selected")
	// But spec says "Widget is only visible when a conversation is selected"
	// However, I will check inside the component or parent.
	// The props say conversationId?
	// I'll render null if no conversationId provided, to be safe.
	if (!conversationId) return null;

	return (
		<div className="border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
				<CollapsibleTrigger asChild>
					<div className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50 bg-linear-to-r from-purple-600/10 to-pink-600/10 border-b border-border/50">
						<div className="flex items-center gap-2">
							<div className="p-1 rounded-full bg-linear-to-br from-purple-500 to-pink-500 shadow-sm">
								<Sparkles className="h-3 w-3 text-white" />
							</div>
							<span className="text-sm font-medium bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
								Assistente IA (Dify)
							</span>
						</div>
						{isOpen ? (
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronUp className="h-4 w-4 text-muted-foreground" />
						)}
					</div>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<div className="p-4 space-y-4">
						{/* Message History */}
						<ScrollArea className="h-[200px] w-full pr-4">
							<div className="space-y-4">
								{messages.length === 0 ? (
									<div className="text-center text-xs text-muted-foreground py-8">
										<p className="mb-2">👋 Olá! Sou a assistente do Grupo US.</p>
										<p>Como posso ajudar você com este atendimento hoje?</p>
									</div>
								) : (
									messages.map((msg, index) => (
										<div
											key={index}
											className={cn(
												'flex flex-col max-w-[85%] text-sm',
												msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start',
											)}
										>
											<div
												className={cn(
													'px-3 py-2 rounded-lg',
													msg.role === 'user'
														? 'bg-linear-to-br from-purple-500 to-pink-500 text-white'
														: 'bg-muted text-foreground',
												)}
											>
												{msg.content}
											</div>
											<span className="text-[10px] text-muted-foreground mt-1">
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
									<div className="flex items-center gap-1.5 p-2 mr-auto">
										<div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
										<div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]" />
										<div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
									</div>
								)}
							</div>
						</ScrollArea>

						{/* Quick Actions */}
						<div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs gap-1.5 bg-background/50 hover:border-purple-500/50 hover:bg-purple-500/5 hover:text-purple-600 transition-colors"
								onClick={() => handleQuickAction('generate')}
							>
								<Wand className="h-3 w-3" />
								Gerar resposta
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs gap-1.5 bg-background/50 hover:border-purple-500/50 hover:bg-purple-500/5 hover:text-purple-600 transition-colors"
								onClick={() => handleQuickAction('summarize')}
							>
								<FileText className="h-3 w-3" />
								Resumir conversa
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs gap-1.5 bg-background/50 hover:border-purple-500/50 hover:bg-purple-500/5 hover:text-purple-600 transition-colors"
								onClick={() => handleQuickAction('template')}
							>
								<MessageSquare className="h-3 w-3" />
								Sugerir template
							</Button>
						</div>

						{/* Input Area */}
						<div className="flex gap-2">
							<Input
								value={inputText}
								onChange={(e) => setInputText(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Digite sua pergunta para a IA de vendas..."
								className="flex-1 h-9 text-sm focus-visible:ring-purple-500"
								disabled={isLoading}
							/>
							<Button
								size="sm"
								className={cn(
									'h-9 w-9 p-0 bg-linear-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all',
									isLoading && 'opacity-50 cursor-not-allowed',
								)}
								onClick={handleSend}
								disabled={isLoading}
							>
								<Send className="h-4 w-4 text-white" />
								<span className="sr-only">Enviar</span>
							</Button>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
