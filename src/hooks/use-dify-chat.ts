import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface DifyMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

interface UseDifyChatReturn {
	messages: DifyMessage[];
	sendMessage: (content: string) => string | undefined;
	isLoading: boolean;
	clearMessages: () => void;
}

export function useDifyChat(): UseDifyChatReturn {
	const [messages, setMessages] = useState<DifyMessage[]>([]);
	const [isLoading] = useState(false);
	const [_conversationId, setConversationId] = useState<string | null>(null);

	// TODO: Add sendMessageToDify as a tRPC action/mutation
	const sendMessage = useCallback((content: string): string | undefined => {
		if (!content.trim()) return undefined;

		const userMessage: DifyMessage = {
			role: 'user',
			content,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);

		// TODO: Replace with tRPC mutation call
		toast.info('Integração Dify será migrada em breve');

		const assistantMessage: DifyMessage = {
			role: 'assistant',
			content: 'Integração com Dify será migrada para tRPC em breve.',
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, assistantMessage]);
		return assistantMessage.content;
	}, []);

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
