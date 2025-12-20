import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export interface DifyMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

interface UseDifyChatReturn {
	messages: DifyMessage[];
	sendMessage: (content: string) => Promise<string | undefined>;
	isLoading: boolean;
	clearMessages: () => void;
}

export function useDifyChat(): UseDifyChatReturn {
	const [messages, setMessages] = useState<DifyMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [conversationId, setConversationId] = useState<string | null>(null);

	const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;
	const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;

	const sendMessage = useCallback(
		async (content: string): Promise<string | undefined> => {
			if (!content.trim()) return undefined;

			if (!(DIFY_API_URL && DIFY_API_KEY)) {
				toast.error('Configuração do Dify API ausente. Verifique as variáveis de ambiente.');
				return undefined;
			}

			try {
				setIsLoading(true);

				// Add user message immediately
				const userMessage: DifyMessage = {
					role: 'user',
					content,
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, userMessage]);

				const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${DIFY_API_KEY}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						query: content,
						user: 'agent-user',
						inputs: {},
						response_mode: 'blocking',
						conversation_id: conversationId,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.message || `Erro na API: ${response.status}`);
				}

				const data = await response.json();

				// Update conversation ID for future messages
				if (data.conversation_id) {
					setConversationId(data.conversation_id);
				}

				const assistantMessage: DifyMessage = {
					role: 'assistant',
					content: data.answer || 'Sem resposta da IA.',
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, assistantMessage]);
				return assistantMessage.content;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Tente novamente.';
				toast.error(`Erro ao conectar com o assistente IA: ${errorMessage}`);
				return undefined;
			} finally {
				setIsLoading(false);
			}
		},
		[conversationId],
	);

	const clearMessages = useCallback(() => {
		setMessages([]);
	}, []);

	return {
		messages,
		sendMessage,
		isLoading,
		clearMessages,
	};
}
