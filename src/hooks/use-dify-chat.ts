import { useAction } from 'convex/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { api } from '../../convex/_generated/api';

interface DifyMessage {
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

	const sendMessageAction = useAction(api.integrations.actions.sendMessageToDify);

	const sendMessage = useCallback(
		async (content: string): Promise<string | undefined> => {
			if (!content.trim()) return undefined;

			try {
				setIsLoading(true);

				// Add user message immediately
				const userMessage: DifyMessage = {
					role: 'user',
					content,
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, userMessage]);

				// Call backend action
				const data = await sendMessageAction({
					query: content,
					user: 'agent-user', // You might want to pass the actual user ID if available
					conversationId: conversationId ?? undefined,
				});

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
		[conversationId, sendMessageAction],
	);

	const clearMessages = useCallback(() => {
		setMessages([]);
		setConversationId(null);
	}, []);

	return {
		messages,
		sendMessage,
		isLoading,
		clearMessages,
	};
}
