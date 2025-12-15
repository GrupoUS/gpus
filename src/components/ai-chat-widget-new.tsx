'use client';

import { Bot, HandHelping, Send, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

export function AIChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [messages, setMessages] = useState<Array<{
		id: string;
		content: string;
		sender: 'user' | 'ai' | 'bot';
		timestamp: Date;
	}>>([
		{
			id: '1',
			content: 'Olá! Sou o assistente IA do Grupo US. Estou aqui para iluminar seu caminho na saúde estética. Como posso ajudar você hoje?',
			sender: 'ai',
			timestamp: new Date(),
		},
	]);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isLoading) return;

		const userMessage = {
			id: Date.now().toString(),
			content: inputValue,
			sender: 'user' as const,
			timestamp: new Date(),
		};

		setMessages(prev => [...prev, userMessage]);
		setInputValue('');
		setIsLoading(true);

		try {
			// Simulate AI response with Grupo US narrative
			// In production, this would call Dify API
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			const lowerInput = inputValue.toLowerCase();
			let response = '';

			// Basic intent recognition based on Grupo US context
			if (lowerInput.includes('trintae3') || lowerInput.includes('curso')) {
				response = 'A TRINTAE3 é nosso programa completo que transforma profissionais da saúde em empresários da estética. Você aprenderá técnica avançada + business. Quer saber mais sobre as turmas ou o investimento?';
			} else if (lowerInput.includes('preço') || lowerInput.includes('valor') || lowerInput.includes('investimento')) {
				response = 'Nós acreditamos que a TRINTAE3 é um investimento, não um custo. A maioria dos nossos alunos recupera o investimento em 3-6 meses após formar o negócio. Posso te apresentar as opções de parcelamento?';
			} else if (lowerInput.includes('tempo') || lowerInput.includes('duração')) {
				response = 'O programa tem duração de 6 meses com encontros ao vivo + aulas gravadas. Desenvolvemos tudo pensando no profissional que trabalha - você estuda no seu ritmo. Faz sentido para você agora?';
			} else if (lowerInput.includes('virada') || lowerInput.includes('transformação')) {
				response = 'A Virada Estética é o nosso conceito principal: sair da exaustão dos plantões para se tornar um empresário da saúde estética. É exatamente o que realizamos com nossos alunos. Em que etapa da sua jornada você está?';
			} else if (lowerInput.includes('agência') || lowerInput.includes('marketing')) {
				response = 'Sim! Além da formação técnica e de negócio, temos programas avançados de marketing e agência para alunos que querem escala. Você já tem sua clínica ou está planejando abrir?';
			} else {
				response = 'Entendo sua dúvida. No Grupo US, não ensinamos apenas técnica - formamos empresários da saúde estética. Nossa abordagem completa inclui: técnica avançada, business, marketing e posicionamento. O que mais te desafia hoje na sua jornada?';
			}

			const aiMessage = {
				id: (Date.now() + 1).toString(),
				content: response,
				sender: 'ai' as const,
				timestamp: new Date(),
			};
			
			setMessages(prev => [...prev, aiMessage]);
		} catch (error) {
			toast.error('Erro ao processar mensagem');
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleEscalate = () => {
		setMessages(prev => [...prev, {
			id: Date.now().toString(),
			content: 'Entendido. Vou transferir sua conversa para um de nossos especialistas humanos. Eles entrarão em contato em breve. Por favor, aguarde.',
			sender: 'bot',
			timestamp: new Date(),
		}]);
		
		// In production, this would create a ticket/assign conversation
		toast.success('Conversa transferida para atendimento humano');
	};

	return (
		<div className="fixed bottom-4 right-4 z-50">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<Button
						size="lg"
						className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-2 border-background animate-pulse-subtle"
						aria-label={isOpen ? 'Fechar assistente IA' : 'Abrir assistente IA'}
					>
						{isOpen ? (
							<X className="h-6 w-6" />
						) : (
							<Bot className="h-6 w-6" />
						)}
					</Button>
				</CollapsibleTrigger>

				<CollapsibleContent className="absolute bottom-16 right-0 w-96 mb-2">
					<MotionWrapper>
						<Card className="glass-card shadow-2xl border-0">
							<CardHeader className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Bot className="h-5 w-5 text-purple-600" />
										<div>
											<h3 className="font-semibold text-sm">Assistente IA</h3>
											<p className="text-xs text-muted-foreground">Grupo US</p>
										</div>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6"
										onClick={() => setIsOpen(false)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</CardHeader>

							<CardContent className="p-0">
								<div className="h-[28rem] flex flex-col">
									{/* Messages Area */}
									<div className="flex-1 overflow-y-auto p-4 space-y-3">
										{messages.map(message => (
											<div
												key={message.id}
												className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
											>
												<div className={`flex items-start gap-2 max-w-[80%] ${
													message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
												}`}>
													<div className={`rounded-lg px-3 py-2 ${
														message.sender === 'user'
															? 'bg-primary text-primary-foreground'
															: 'bg-muted'
													}`}>
														<p className="text-sm whitespace-pre-wrap">{message.content}</p>
														<p className="text-xs opacity-70 mt-1">
															{message.timestamp.toLocaleTimeString('pt-BR', {
																hour: '2-digit',
																minute: '2-digit',
															})}
														</p>
													</div>
													<div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
														message.sender === 'user' 
															? 'bg-primary text-primary-foreground ml-2' 
															: 'bg-muted text-muted-foreground mr-2'
													}`}>
														{message.sender === 'user' ? (
															<User className="h-3 w-3" />
														) : (
															<Bot className="h-3 w-3" />
														)}
													</div>
												</div>
											</div>
										))}
										
										{isLoading && (
											<div className="flex justify-start">
												<div className="flex items-start gap-2">
													<div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center mr-2">
														<Bot className="h-3 w-3 text-muted-foreground" />
													</div>
													<div className="bg-muted rounded-lg px-3 py-2">
														<div className="flex items-center gap-1">
															<div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
															<div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75" />
															<div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
														</div>
													</div>
												</div>
											</div>
										)}
										<div ref={messagesEndRef} />
									</div>

									<Separator />

									{/* Input Area */}
									<div className="p-3">
										<div className="flex gap-2 mb-2">
											<Input
												value={inputValue}
												onChange={(e) => setInputValue(e.target.value)}
												onKeyPress={handleKeyPress}
												placeholder="Digite sua mensagem sobre a Virada Estética..."
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

										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2 text-xs text-muted-foreground">
												<HandHelping className="h-3 w-3" />
												<span>Precisa de ajuda humana?</span>
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={handleEscalate}
												className="text-xs"
											>
												Falar com humano
											</Button>
										</div>
										
										<div className="mt-2 pt-2 border-t text-xs text-muted-foreground text-center">
											<p>IA treinada na narrativa "Profissional Abandonado → Empresário da Saúde Estética"</p>
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
