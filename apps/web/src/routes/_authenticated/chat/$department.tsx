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
	const { search, statusFilter, portalTargetId } = useChatContext();
	const [portalContainer, setPortalContainer] = useState<Element | null>(null);

	useEffect(() => {
		const el = document.getElementById(portalTargetId);
		if (el) setPortalContainer(el);
	}, [portalTargetId]);

	return (
		<>
			{portalContainer &&
				createPortal(
					<ConversationList
						department={department}
						search={search}
						statusFilter={statusFilter === 'all' ? undefined : statusFilter}
					/>,
					portalContainer,
				)}
			<div className="flex h-full min-w-0 flex-1 flex-col">
				<Outlet />
			</div>
		</>
	);
}
