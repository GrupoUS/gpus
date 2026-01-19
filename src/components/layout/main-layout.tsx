import { UserButton } from '@clerk/clerk-react';
import { useLocation } from '@tanstack/react-router';
import { useId } from 'react';

import { AppSidebar } from './app-sidebar';
import { AIChatWidget } from '@/components/ai-chat-widget-new';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

export function MainLayout({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const mainContentId = useId();

	return (
		<div className="flex h-screen w-full flex-col md:flex-row">
			<AppSidebar />
			<main className="flex flex-1 flex-col overflow-hidden bg-mesh bg-noise" id={mainContentId}>
				<header className="z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
					<div className="flex items-center gap-2 px-4">
						<Separator className="mr-2 hidden h-4 md:block" orientation="vertical" />
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem className="hidden md:block">
									<BreadcrumbLink href="/">Portal</BreadcrumbLink>
								</BreadcrumbItem>
								{location.pathname !== '/' && (
									<>
										<BreadcrumbSeparator className="hidden md:block" />
										<BreadcrumbItem>
											<BreadcrumbPage>
												{location.pathname.split('/').filter(Boolean).pop()?.toUpperCase() ||
													'DASHBOARD'}
											</BreadcrumbPage>
										</BreadcrumbItem>
									</>
								)}
							</BreadcrumbList>
						</Breadcrumb>
					</div>
					<div className="ml-auto px-4">
						<UserButton afterSignOutUrl="/" />
					</div>
				</header>
				<div className="flex-1 overflow-auto p-6">{children}</div>
			</main>
			<AIChatWidget />
		</div>
	);
}
