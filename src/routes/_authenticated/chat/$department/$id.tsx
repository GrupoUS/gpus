import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { trpc } from '../../../../lib/trpc';
import { ChatWindow } from '@/components/chat/chat-window';

export const Route = createFileRoute('/_authenticated/chat/$department/$id')({
	component: ConversationPage,
});

function ConversationPage() {
	// Use properly typed params from the Route definition
	const { department, id } = Route.useParams();
	const navigate = useNavigate();

	// Cast id to number as it comes as string from URL
	const { data: conversation } = trpc.conversations.get.useQuery({ id: id as number });
	const { data: messages } = trpc.messages.listByConversation.useQuery({
		conversationId: id as number,
	});
	const sendMessage = trpc.messages.send.useMutation();

	const handleSendMessage = async (content: string) => {
		await sendMessage({ conversationId: id as number, content, contentType: 'text' });
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
