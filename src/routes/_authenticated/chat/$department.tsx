import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useChatContext } from '../chat';
import { ConversationList } from '@/components/chat/conversation-list';

export const Route = createFileRoute('/_authenticated/chat/$department')({
	component: DepartmentRoute,
});

function DepartmentRoute() {
	// biome-ignore lint/suspicious/noExplicitAny: Params type from Tanstack Router can be vague
	const params = Route.useParams() as any;
	// biome-ignore lint/suspicious/noExplicitAny: Params type
	const { department } = params as any;
	const { search, statusFilter } = useChatContext();
	const [portalContainer, setPortalContainer] = useState<Element | null>(null);

	useEffect(() => {
		const el = document.getElementById('conversation-list-portal');
		if (el) setPortalContainer(el);
	}, []);

	return (
		<>
			{portalContainer &&
				createPortal(
					<ConversationList
						department={department}
						statusFilter={statusFilter === 'all' ? undefined : statusFilter}
						// Pass search if ConversationList accepts it, step 2 says 'Update ConversationList... Add search filter support'
						// I will assume prop name is 'searchQuery' or similar, but plan says 'pass search param to query'.
						// I'll call the prop 'search' for now and fix ConversationList to match.
						search={search}
					/>,
					portalContainer,
				)}
			<div className="flex-1 flex flex-col min-w-0 h-full">
				<Outlet />
			</div>
		</>
	);
}
