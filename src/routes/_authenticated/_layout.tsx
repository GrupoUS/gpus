import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
	BarChart3,
	Home,
	MessageSquare,
	Settings,
	Users,
	Calendar,
	FileText,
	HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
	{
		name: 'Dashboard',
		href: '/dashboard',
		icon: Home,
		current: false
	},
	{
		name: 'Leads',
		href: '/leads',
		icon: Users,
		current: false
	},
	{
		name: 'CRM',
		href: '/crm',
		icon: MessageSquare,
		current: false
	},
	{
		name: 'Analytics',
		href: '/analytics',
		icon: BarChart3,
		current: false
	},
	{
		name: 'Calendar',
		href: '/calendar',
		icon: Calendar,
		current: false
	},
	{
		name: 'Documents',
		href: '/documents',
		icon: FileText,
		current: false
	},
	{
		name: 'Settings',
		href: '/settings',
		icon: Settings,
		current: false
	},
	{
		name: 'Help',
		href: '/help',
		icon: HelpCircle,
		current: false
	}
];

export default function AuthenticatedLayout() {
	const location = useLocation();
	
	// Update current route
	const navItems = navigation.map(item => ({
		...item,
		current: location.pathname === item.href
	}));

	return (
		<div className="flex min-h-screen bg-background">
			{/* Sidebar */}
			<aside className="w-64 bg-card border-r border-border flex flex-col fixed left-0 top-0 h-full z-40">
				{/* Logo */}
				<motion.div 
					className="p-6 border-b border-border"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<Link to="/dashboard" className="flex items-center space-x-3 group">
						<div className="w-10 h-10 bg-gradient-to-br from-primary to-us-gold rounded-xl flex items-center justify-center shadow-lg sidebar-logo">
							<span className="text-primary-foreground font-bold text-lg font-display">GU</span>
						</div>
						<span className="font-display font-bold text-xl tracking-tight text-gradient group-hover:text-primary transition-colors">
							Grupo US
						</span>
					</Link>
				</motion.div>

				{/* Navigation */}
				<nav className="flex-1 p-4 space-y-2">
					{navItems.map((item, index) => (
						<motion.div
							key={item.href}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: index * 0.05 }}
						>
							<Link
								to={item.href}
								className={cn(
									'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 sidebar-menu-item',
									item.current 
										? 'bg-primary text-primary-foreground shadow-sm' 
										: 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
								)}
							>
								<item.icon className="h-5 w-5" />
								<span className="font-sans">{item.name}</span>
							</Link>
						</motion.div>
					))}
				</nav>

				{/* User Card */}
				<motion.div 
					className="p-4 border-t border-border"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.5 }}
				>
					<div className="bg-sidebar-accent rounded-lg p-3 border border-border/30">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
								<span className="text-primary text-sm font-medium">JD</span>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-foreground truncate">João Developer</p>
								<p className="text-xs text-muted-foreground truncate">joao@grupous.com.br</p>
							</div>
						</div>
					</div>
				</motion.div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 ml-64 min-h-screen">
				<motion.div
					className="h-full"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6 }}
				>
					<Outlet />
				</motion.div>
			</main>
		</div>
	);
}
