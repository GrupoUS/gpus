import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export interface DifyMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

interface UseDifyChatReturn {
	messages: DifyMessage[];
	sendMessage: (content: string) => Promise<void>;
	isLoading: boolean;
	clearMessages: () => void;
}

export function useDifyChat(): UseDifyChatReturn {
	const [messages, setMessages] = useState<DifyMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// TODO: Add environment variables for Dify API
	// const DIFY_API_URL = process.env.VITE_DIFY_API_URL;
	// const DIFY_API_KEY = process.env.VITE_DIFY_API_KEY;

	const sendMessage = useCallback(async (content: string) => {
		if (!content.trim()) return;

		try {
			setIsLoading(true);

			// Add user message immediately
			const userMessage: DifyMessage = {
				role: 'user',
				content,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, userMessage]);

			// TODO: Implement actual Dify API call here
			// const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
			//   method: 'POST',
			//   headers: {
			//     'Authorization': `Bearer ${DIFY_API_KEY}`,
			//     'Content-Type': 'application/json',
			//   },
			//   body: JSON.stringify({
			//     query: content,
			//     user: 'agent-user',
			//     inputs: {},
			//     conversation_id: currentConversationId,
			//   }),
			// });

			// Simulate API delay and response
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const assistantMessage: DifyMessage = {
				role: 'assistant',
				content: `Esta é uma resposta simulada da IA para: "${content}". \n\nQuando a integração com o Dify estiver completa, aqui aparecerá a resposta real do assistente baseada no contexto da conversa.`,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} catch (error) {
			toast.error(
				`Erro ao conectar com o assistente IA: ${error instanceof Error ? error.message : 'Tente novamente.'}`,
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

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
