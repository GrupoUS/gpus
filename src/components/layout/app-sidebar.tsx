import { UserButton, useUser } from '@clerk/clerk-react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
	BarChart3,
	GraduationCap,
	Kanban,
	LayoutDashboard,
	MessageSquare,
	Settings,
} from 'lucide-react';
import { useState } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/aceternity-sidebar';
import { cn } from '@/lib/utils';

const menuItems = [
	{
		label: 'Dashboard',
		href: '/dashboard',
		icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
	},
	{
		label: 'CRM',
		href: '/crm',
		icon: <Kanban className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
	},
	{
		label: 'Chat',
		href: '/chat',
		icon: <MessageSquare className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
	},
	{
		label: 'Alunos',
		href: '/students',
		icon: <GraduationCap className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
	},
	{
		label: 'Relatórios',
		href: '/reports',
		icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
	},
	{
		label: 'Configurações',
		href: '/settings',
		icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />,
	},
];

export function AppSidebar() {
	const { user } = useUser();
	const [open, setOpen] = useState(false);

	return (
		<div
			className={cn(
				'rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 max-w-7xl mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden',
				'h-screen', // Full height
			)}
		>
			<Sidebar open={open} setOpen={setOpen}>
				<SidebarBody className="justify-between gap-10">
					<div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
						{open ? <Logo /> : <LogoIcon />}
						<div className="mt-8 flex flex-col gap-2">
							{menuItems.map((item, idx) => (
								<SidebarLink key={idx} link={item} />
							))}
						</div>
					</div>
					<div>
						<SidebarLink
							link={{
								label: user?.fullName || 'Usuário',
								href: '#',
								icon: (
									<div className="h-7 w-7 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
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
		</div>
	);
}

export const Logo = () => {
	return (
		<Link
			to="/dashboard"
			className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
		>
			<div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
			<motion.span
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="font-medium text-black dark:text-white whitespace-pre"
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
			className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
		>
			<div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
		</Link>
	);
};
