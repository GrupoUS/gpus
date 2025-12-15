import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useChatContext } from '../chat';
import { ConversationList } from '@/components/chat/conversation-list';

export const Route = createFileRoute('/_authenticated/chat/$department')({
	component: DepartmentRoute,
});

function DepartmentRoute() {
	// Use properly typed params from the Route definition
	const { department } = Route.useParams();
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
