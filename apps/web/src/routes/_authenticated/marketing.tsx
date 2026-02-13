import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { FileCode, LayoutDashboard, Mail, Users } from 'lucide-react';

import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/marketing')({
	component: MarketingLayout,
});

function MarketingLayout() {
	const { pathname } = useLocation();

	const navItems = [
		{
			label: 'Dashboard',
			href: '/marketing/dashboard',
			icon: LayoutDashboard,
			active: pathname.includes('/marketing/dashboard'),
		},
		{
			label: 'Campanhas',
			href: '/marketing/campanhas',
			icon: Mail,
			active:
				pathname.includes('/marketing/campanhas') ||
				pathname.includes('/marketing/nova') ||
				(pathname.includes('/marketing/') &&
					!pathname.includes('contatos') &&
					!pathname.includes('templates') &&
					!pathname.includes('dashboard')),
		},
		{
			label: 'Contatos',
			href: '/marketing/contatos',
			icon: Users,
			active: pathname.includes('/marketing/contatos'),
		},
		{
			label: 'Templates',
			href: '/marketing/templates',
			icon: FileCode,
			active: pathname.includes('/marketing/templates'),
		},
	];

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="border-b">
				<div className="flex h-12 items-center gap-6 overflow-x-auto px-4">
					{navItems.map((item) => (
						<Link
							className={cn(
								'flex items-center gap-2 whitespace-nowrap border-transparent border-b-2 py-3 font-medium text-sm transition-colors hover:text-primary',
								item.active ? 'border-primary text-primary' : 'text-muted-foreground',
							)}
							key={item.href}
							to={item.href}
						>
							<item.icon className="h-4 w-4" />
							{item.label}
						</Link>
					))}
				</div>
			</div>
			<div className="flex-1 overflow-auto">
				<Outlet />
			</div>
		</div>
	);
}
