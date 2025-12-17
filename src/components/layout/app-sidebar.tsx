import { UserButton, useUser } from '@clerk/clerk-react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
	BarChart3,
	FileText,
	GraduationCap,
	Kanban,
	LayoutDashboard,
	Mail,
	MessageSquare,
	Plug,
	Settings,
	TrendingUp,
	Users,
} from 'lucide-react';
import { useState } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import {
	Sidebar,
	SidebarBody,
	SidebarLink,
	SidebarLinkWithSubmenu,
} from '@/components/ui/aceternity-sidebar';

const menuItems = [
	{
		label: 'Dashboard',
		href: '/dashboard',
		icon: <LayoutDashboard className="text-sidebar-foreground h-5 w-5 shrink-0" />,
	},
	{
		label: 'CRM',
		href: '/crm',
		icon: <Kanban className="text-sidebar-foreground h-5 w-5 shrink-0" />,
	},
	{
		label: 'Students',
		href: '/students',
		icon: <GraduationCap className="text-sidebar-foreground h-5 w-5 shrink-0" />,
	},
	{
		label: 'Chat',
		href: '/chat',
		icon: <MessageSquare className="text-sidebar-foreground h-5 w-5 shrink-0" />,
	},
	{
		label: 'Marketing',
		href: '/marketing',
		icon: <Mail className="text-sidebar-foreground h-5 w-5 shrink-0" />,
	},
	{
		label: 'Reports',
		href: '/reports',
		icon: <BarChart3 className="text-sidebar-foreground h-5 w-5 shrink-0" />,
		children: [
			{
				label: 'Sales',
				href: '/reports/sales',
				icon: <TrendingUp className="text-sidebar-foreground h-4 w-4 shrink-0" />,
			},
			{
				label: 'Team',
				href: '/reports/team',
				icon: <Users className="text-sidebar-foreground h-4 w-4 shrink-0" />,
			},
		],
	},
	{
		label: 'Settings',
		href: '/settings',
		icon: <Settings className="text-sidebar-foreground h-5 w-5 shrink-0" />,
		children: [
			{
				label: 'Team',
				href: '/settings/team',
				icon: <Users className="text-sidebar-foreground h-4 w-4 shrink-0" />,
			},
			{
				label: 'Templates',
				href: '/settings/templates',
				icon: <FileText className="text-sidebar-foreground h-4 w-4 shrink-0" />,
			},
			{
				label: 'Integrations',
				href: '/settings/integrations',
				icon: <Plug className="text-sidebar-foreground h-4 w-4 shrink-0" />,
			},
		],
	},
];

export function AppSidebar() {
	const { user } = useUser();
	const [open, setOpen] = useState(false);

	return (
		<Sidebar open={open} setOpen={setOpen}>
			<SidebarBody className="justify-between gap-10">
				<div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
					{open ? <Logo /> : <LogoIcon />}
					<div className="mt-8">
						{/* Desktop View */}
						<div className="hidden md:flex flex-col gap-2">
							{menuItems.map((item, idx) =>
								item.children ? (
									<SidebarLinkWithSubmenu key={idx} link={item} />
								) : (
									<SidebarLink key={idx} link={item} />
								),
							)}
						</div>

						{/* Mobile View */}
						<div className="md:hidden flex flex-col gap-2">
							{menuItems.map((item, idx) => (
								<div key={idx}>
									{item.children ? (
										<>
											{/* Render parent as navigable link */}
											<SidebarLink link={item} />
											<div className="ml-4 space-y-1">
												{item.children.map((child, cIdx) => (
													<SidebarLink key={cIdx} link={child} />
												))}
											</div>
										</>
									) : (
										<SidebarLink link={item} />
									)}
								</div>
							))}
						</div>
					</div>
				</div>
				<div>
					<SidebarLink
						link={{
							label: user?.fullName || 'Usuário',
							href: '#',
							icon: (
								<div className="h-7 w-7 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
									<UserButton
										afterSignOutUrl="/sign-in"
										appearance={{
											elements: {
												avatarBox: 'h-7 w-7',
											},
										}}
									/>
								</div>
							),
						}}
					/>
					<div className="mt-2 pl-2">
						<ThemeToggle />
					</div>
				</div>
			</SidebarBody>
		</Sidebar>
	);
}

export const Logo = () => {
	return (
		<Link
			to="/dashboard"
			className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20"
		>
			<div className="h-5 w-6 bg-foreground rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
			<motion.span
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="font-medium text-foreground whitespace-pre"
			>
				Grupo US
			</motion.span>
		</Link>
	);
};

export const LogoIcon = () => {
	return (
		<Link
			to="/dashboard"
			className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20"
		>
			<div className="h-5 w-6 bg-foreground rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
		</Link>
	);
};
