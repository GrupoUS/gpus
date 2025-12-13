import { UserButton, useUser } from '@clerk/clerk-react';
import { Link, useLocation } from '@tanstack/react-router';
import {
	BarChart3,
	GraduationCap,
	Kanban,
	LayoutDashboard,
	MessageSquare,
	Settings,
} from 'lucide-react';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

const menuItems = [
	{ title: 'Dashboard', icon: LayoutDashboard, href: '/' },
	{ title: 'CRM', icon: Kanban, href: '/crm' },
	{ title: 'Chat', icon: MessageSquare, href: '/chat' },
	{ title: 'Alunos', icon: GraduationCap, href: '/students' },
	{ title: 'Relatórios', icon: BarChart3, href: '/reports' },
	{ title: 'Configurações', icon: Settings, href: '/settings' },
];

export function AppSidebar() {
	const location = useLocation();
	const { user } = useUser();

	return (
		<Sidebar className="card-glass">
			<SidebarHeader className="border-b p-4 border-sidebar-border/50">
				<div className="flex items-center gap-2">
					<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center sidebar-logo">
						<span className="text-primary-foreground font-bold text-sm font-display">US</span>
					</div>
					<div>
						<p className="font-semibold text-sm font-display">Grupo US</p>
						<p className="text-xs text-muted-foreground font-sans">Portal de Gestão</p>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Menu</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => {
								const isActive =
									location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
								return (
									<SidebarMenuItem
										key={item.href}
										className={isActive ? 'sidebar-menu-item active' : 'sidebar-menu-item'}
									>
										<SidebarMenuButton asChild isActive={isActive}>
											<Link to={item.href}>
												<item.icon className="h-4 w-4" />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t p-4 border-sidebar-border/50">
				<div className="flex items-center gap-3">
					<UserButton afterSignOutUrl="/sign-in" />
					<div className="flex-1 min-w-0">
						{/* Show fallback if user not loaded yet */}
						<p className="text-sm font-medium truncate font-sans">{user?.fullName || 'Usuário'}</p>
						<p className="text-xs text-muted-foreground truncate font-sans">
							{user?.primaryEmailAddress?.emailAddress}
						</p>
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
