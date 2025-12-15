'use client';

import { Bot, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

interface Message {
	id: string;
	content: string;
	sender: 'user' | 'ai';
	timestamp: Date;
}

export function AIChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: '1',
			content: 'Olá! Sou o assistente IA do Grupo US. Como posso ajudar você hoje?',
			sender: 'ai',
			timestamp: new Date(),
		},
	]);
	const [inputValue, setInputValue] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [, scrollToBottom]);

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			content: inputValue,
			sender: 'user',
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputValue('');
		setIsLoading(true);

		// Simulate AI response
		setTimeout(() => {
			const aiMessage: Message = {
				id: (Date.now() + 1).toString(),
				content:
					'Estou processando sua pergunta. Em um ambiente real, eu estaria conectado à API Dify para fornecer respostas baseadas na narrativa do Grupo US.',
				sender: 'ai',
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, aiMessage]);
			setIsLoading(false);
		}, 1000);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	return (
		<div className="fixed bottom-4 right-4 z-50">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<Button
						size="lg"
						className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-2 border-background"
						aria-label={isOpen ? 'Fechar chat IA' : 'Abrir chat IA'}
					>
						{isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
					</Button>
				</CollapsibleTrigger>

				<CollapsibleContent className="absolute bottom-16 right-0 w-96 mb-2">
					<MotionWrapper>
						<Card className="glass-card shadow-2xl border-0">
							<CardHeader className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b">
								<div className="flex items-center gap-2">
									<Bot className="h-5 w-5 text-purple-600" />
									<div>
										<h3 className="font-semibold text-sm">Assistente IA</h3>
										<p className="text-xs text-muted-foreground">Grupo US</p>
									</div>
								</div>
							</CardHeader>

							<CardContent className="p-0">
								<div className="h-96 flex flex-col">
									{/* Messages Area */}
									<div className="flex-1 overflow-y-auto p-4 space-y-3">
										{messages.map((message) => (
											<div
												key={message.id}
												className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
											>
												<div
													className={`max-w-[80%] rounded-lg px-3 py-2 ${
														message.sender === 'user'
															? 'bg-primary text-primary-foreground'
															: 'bg-muted'
													}`}
												>
													<p className="text-sm">{message.content}</p>
													<p className="text-xs opacity-70 mt-1">
														{message.timestamp.toLocaleTimeString('pt-BR', {
															hour: '2-digit',
															minute: '2-digit',
														})}
													</p>
												</div>
											</div>
										))}

										{isLoading && (
											<div className="flex justify-start">
												<div className="bg-muted rounded-lg px-3 py-2">
													<div className="flex items-center gap-1">
														<div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
														<div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75" />
														<div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
													</div>
												</div>
											</div>
										)}
										<div ref={messagesEndRef} />
									</div>

									{/* Input Area */}
									<div className="border-t p-3">
										<div className="flex gap-2">
											<Input
												value={inputValue}
												onChange={(e) => setInputValue(e.target.value)}
												onKeyPress={handleKeyPress}
												placeholder="Digite sua mensagem..."
												className="flex-1"
												disabled={isLoading}
											/>
											<Button
												size="icon"
												onClick={handleSendMessage}
												disabled={!inputValue.trim() || isLoading}
											>
												<Send className="h-4 w-4" />
											</Button>
										</div>

										<div className="mt-2 text-xs text-muted-foreground text-center">
											<p>IA treinada na narrativa do Grupo US</p>
											<p>Em caso de dúvidas complexas, fale com um humano</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</MotionWrapper>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
