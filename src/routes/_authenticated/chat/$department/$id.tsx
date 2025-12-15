import type { Id } from '@convex/_generated/dataModel';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { ChatWindow } from '@/components/chat/chat-window';

export const Route = createFileRoute('/_authenticated/chat/$department/$id')({
	component: ConversationPage,
});

function ConversationPage() {
	// Use properly typed params from the Route definition
	const { department, id } = Route.useParams();
	const navigate = useNavigate();

	// Cast id to Id<'conversations'> as it comes as string from URL
	const conversationId = id as Id<'conversations'>;

	const handleBack = () => {
		// Use router navigation instead of window.history.back for consistency
		void navigate({
			to: '/chat/$department',
			params: { department },
		});
	};

	return (
		<div className="h-full w-full">
			<ChatWindow conversationId={conversationId} onBack={handleBack} />
		</div>
	);
}
