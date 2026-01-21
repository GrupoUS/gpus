import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';

import { ChatWindow } from '@/components/chat/chat-window';

export const Route = createFileRoute('/_authenticated/chat/$department/$id')({
	component: ConversationPage,
});

function ConversationPage() {
	// Use properly typed params from the Route definition
	const { department, id } = Route.useParams();
	const navigate = useNavigate();

	// Cast id to Id<'conversations'> as it comes as string from URL
	const conversation = useQuery(api.conversations.getById, { id: id as Id<'conversations'> });
	const messages = useQuery(api.messages.getByConversation, {
		conversationId: id as Id<'conversations'>,
	});
	const sendMessage = useMutation(api.messages.send);

	const handleSendMessage = async (content: string) => {
		await sendMessage({ conversationId: id as Id<'conversations'>, content, contentType: 'text' });
	};

	return (
		<div className="h-full w-full">
			<ChatWindow
				conversation={conversation}
				messages={messages}
				onBack={() => {
					void navigate({
						to: '/chat/$department',
						params: { department },
					});
				}}
				onSendMessage={handleSendMessage}
			/>
		</div>
	);
}
