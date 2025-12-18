import { createFileRoute, Link } from '@tanstack/react-router';
import {
	Bell,
	ChevronRight,
	FileText,
	Key,
	Palette,
	Plug,
	Settings as SettingsIcon,
	Shield,
	User,
	Users,
} from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import React from 'react';

import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/settings/')({
	component: SettingsPage,
});

interface SettingItemProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	href?: string;
	onClick?: () => void;
	colorClass?: string;
}

interface SettingSectionProps {
	title: string;
	icon: React.ReactNode;
	colorClass: string;
	children: React.ReactNode;
	className?: string;
}

const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			ease: 'easeOut',
		},
	},
};

const staggerContainer: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.1,
		},
	},
};

function SettingItem({
	icon,
	title,
	description,
	href,
	onClick,
	colorClass = 'from-purple-500/20 to-indigo-500/20',
}: SettingItemProps) {
	const content = (
		<motion.button
			type="button"
			variants={fadeInUp}
			whileHover={{ scale: 1.02, y: -2 }}
			whileTap={{ scale: 0.98 }}
			className={cn(
				'flex flex-col items-center gap-3 p-5 rounded-xl border transition-all cursor-pointer w-full',
				'bg-background/60 backdrop-blur-sm',
				'hover:shadow-lg hover:border-primary/30',
				'group',
			)}
			onClick={onClick}
		>
			{/* Icon with circular gradient background */}
			<div
				className={cn(
					'h-14 w-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110',
					`bg-gradient-to-br ${colorClass}`,
				)}
			>
				{React.cloneElement(icon as React.ReactElement, {
					className: 'h-7 w-7',
				})}
			</div>

			{/* Title and description */}
			<div className="text-center">
				<h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
					{title}
				</h3>
				<p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
			</div>

			{/* Arrow indicator */}
			<ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3" />
		</motion.button>
	);

	if (href) {
		return (
			<Link to={href} className="relative block">
				{content}
			</Link>
		);
	}

	return <div className="relative">{content}</div>;
}

function SettingSection({ title, icon, colorClass, children, className }: SettingSectionProps) {
	return (
		<motion.div
			variants={fadeInUp}
			whileHover={{ y: -4 }}
			transition={{ type: 'spring', stiffness: 300, damping: 25 }}
			className={cn(
				'rounded-2xl p-5 border transition-all duration-300',
				'bg-gradient-to-b from-card/80 via-card/60 to-card/40',
				'backdrop-blur-sm',
				'hover:shadow-xl hover:border-primary/20',
				'shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)]',
				className,
			)}
		>
			{/* Section Header */}
			<div className="flex items-center gap-3 mb-5">
				<div
					className={cn(
						'h-10 w-10 rounded-lg flex items-center justify-center',
						`bg-gradient-to-br ${colorClass}`,
					)}
				>
					{React.cloneElement(icon as React.ReactElement, {
						className: 'h-5 w-5 text-white',
					})}
				</div>
				<h2 className="text-lg font-semibold">{title}</h2>
			</div>

			{/* Items Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
		</motion.div>
	);
}

function SettingsPage() {
	return (
		<div className="p-4 sm:p-6 lg:p-8 w-full">
			{/* Header */}
			<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
				<h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
					<div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
						<SettingsIcon className="h-5 w-5 text-white" />
					</div>
					Configurações
				</h1>
				<p className="text-muted-foreground mt-2">Gerencie as configurações do sistema</p>
			</motion.div>

			{/* Bento Grid Layout */}
			<motion.div
				initial="hidden"
				animate="visible"
				variants={staggerContainer}
				className="grid grid-cols-1 lg:grid-cols-2 gap-6"
			>
				{/* Conta - Full Width on Mobile, Half on Desktop */}
				<SettingSection
					title="Conta"
					icon={<User />}
					colorClass="from-purple-500 to-purple-600"
					className="lg:col-span-2"
				>
					<SettingItem
						icon={<User className="text-purple-500" />}
						title="Perfil"
						description="Gerencie suas informações pessoais"
						href="/settings/profile"
						colorClass="from-purple-500/20 to-purple-600/20"
					/>
					<SettingItem
						icon={<Key className="text-purple-500" />}
						title="Segurança"
						description="Autenticação e controle de acesso"
						href="/settings/security"
						colorClass="from-purple-500/20 to-purple-600/20"
					/>
					<SettingItem
						icon={<Bell className="text-purple-500" />}
						title="Notificações"
						description="Configure alertas e preferências"
						href="/settings/notifications"
						colorClass="from-purple-500/20 to-purple-600/20"
					/>
				</SettingSection>

				{/* Equipe */}
				<SettingSection title="Equipe" icon={<Users />} colorClass="from-blue-500 to-blue-600">
					<SettingItem
						icon={<Users className="text-blue-500" />}
						title="Membros"
						description="Gerencie usuários e permissões"
						href="/settings/team"
						colorClass="from-blue-500/20 to-blue-600/20"
					/>
					<SettingItem
						icon={<Shield className="text-blue-500" />}
						title="Funções e Permissões"
						description="Configure níveis de acesso"
						href="/settings/roles"
						colorClass="from-blue-500/20 to-blue-600/20"
					/>
				</SettingSection>

				{/* Sistema */}
				<SettingSection
					title="Sistema"
					icon={<SettingsIcon />}
					colorClass="from-green-500 to-green-600"
				>
					<SettingItem
						icon={<FileText className="text-green-500" />}
						title="Templates de Mensagem"
						description="Gerencie templates para chat"
						href="/settings/templates"
						colorClass="from-green-500/20 to-green-600/20"
					/>
					<SettingItem
						icon={<Palette className="text-green-500" />}
						title="Aparência"
						description="Personalize a interface"
						href="/settings/appearance"
						colorClass="from-green-500/20 to-green-600/20"
					/>
				</SettingSection>

				{/* Integrações */}
				<SettingSection
					title="Integrações"
					icon={<Plug />}
					colorClass="from-orange-500 to-orange-600"
					className="lg:col-span-2"
				>
					<SettingItem
						icon={<Plug className="text-orange-500" />}
						title="Integrações"
						description="WhatsApp, Instagram e outros canais"
						href="/settings/integrations"
						colorClass="from-orange-500/20 to-orange-600/20"
					/>
				</SettingSection>
			</motion.div>
		</div>
	);
}
