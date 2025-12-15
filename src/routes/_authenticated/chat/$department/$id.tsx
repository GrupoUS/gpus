import type { Id } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';

import { ChatWindow } from '@/components/chat/chat-window';

export const Route = createFileRoute('/_authenticated/chat/$department/$id')({
	component: ConversationPage,
});

function ConversationPage() {
	// biome-ignore lint/suspicious/noExplicitAny: Params type from Tanstack Router can be vague
	const params = Route.useParams() as any;
	// Cast id to Id<'conversations'> and ensure it's treated as string from URL
	const conversationId = params.id as Id<'conversations'>;

	return (
		<div className="h-full w-full">
			<ChatWindow
				conversationId={conversationId}
				onBack={() => {
					// For mobile, we might want to go up one level
					window.history.back();
				}}
			/>
		</div>
	);
}
