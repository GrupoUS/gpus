import { UserButton, useUser } from '@clerk/clerk-react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
	BarChart3,
	GraduationCap,
	LayoutDashboard,
	Megaphone,
	MessageCircle,
	Settings2,
	UserPlus,
	Users2,
} from 'lucide-react';
import { useState } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/aceternity-sidebar';

const menuItems = [
	{
		label: 'Painel',
		href: '/dashboard',
		icon: <LayoutDashboard className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
	},
	{
		label: 'CRM',
		href: '/crm',
		icon: <Users2 className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
	},
	{
		label: 'Alunos',
		href: '/students',
		icon: <GraduationCap className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
	},
	{
		label: 'Chat',
		href: '/chat',
		icon: <MessageCircle className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
	},
	{
		label: 'Marketing',
		href: '/marketing/dashboard',
		icon: <Megaphone className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
	},
	{
		label: 'Leads de Captura',
		href: '/marketing/leads',
		icon: <UserPlus className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
	},
	{
		label: 'Relatórios',
		href: '/reports',
		icon: <BarChart3 className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
	},
	{
		label: 'Configurações',
		href: '/settings',
		icon: <Settings2 className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
	},
];

export function AppSidebar() {
	const { user } = useUser();
	const [open, setOpen] = useState(false);

	return (
		<Sidebar open={open} setOpen={setOpen}>
			<SidebarBody className="justify-between gap-10">
				<div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
					{open ? <Logo /> : <LogoIcon />}
					<div className="mt-8">
						{/* Desktop View */}
						<div className="hidden flex-col gap-2 md:flex">
							{menuItems.map((item, idx) => (
								<SidebarLink key={idx} link={item} />
							))}
						</div>

						{/* Mobile View */}
						<div className="flex flex-col gap-2 md:hidden">
							{menuItems.map((item, idx) => (
								<SidebarLink key={idx} link={item} />
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
								<div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
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

const Logo = () => {
	return (
		<Link
			className="relative z-20 flex items-center space-x-2 py-1 font-normal text-foreground text-sm"
			to="/dashboard"
		>
			<div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-foreground" />
			<motion.span
				animate={{ opacity: 1 }}
				className="whitespace-pre font-medium text-foreground"
				initial={{ opacity: 0 }}
			>
				Grupo US
			</motion.span>
		</Link>
	);
};

const LogoIcon = () => {
	return (
		<Link
			className="relative z-20 flex items-center space-x-2 py-1 font-normal text-foreground text-sm"
			to="/dashboard"
		>
			<div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-foreground" />
		</Link>
	);
};
