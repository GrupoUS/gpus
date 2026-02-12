import { createFileRoute, Link } from '@tanstack/react-router';
import {
	Bell,
	ChevronRight,
	FileText,
	Key,
	ListPlus,
	type LucideProps,
	Palette,
	Plug,
	Settings as SettingsIcon,
	Shield,
	Tag,
	User,
	Users,
} from 'lucide-react';
import { motion, type Variants } from 'motion/react';

import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/settings/')({
	component: SettingsPage,
});

interface SettingItemProps {
	Icon: React.ComponentType<LucideProps>;
	title: string;
	description: string;
	href?: string;
	onClick?: () => void;
	colorClass?: string;
	iconColorClass?: string;
}

interface SettingSectionProps {
	title: string;
	Icon: React.ComponentType<LucideProps>;
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
	Icon,
	title,
	description,
	href,
	onClick,
	colorClass = 'from-purple-500/20 to-indigo-500/20',
	iconColorClass = 'text-purple-500',
}: SettingItemProps) {
	const content = (
		<motion.button
			className={cn(
				'flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border p-5 transition-all',
				'bg-background/60 backdrop-blur-sm',
				'hover:border-primary/30 hover:shadow-lg',
				'group',
			)}
			onClick={onClick}
			type="button"
			variants={fadeInUp}
			whileHover={{ scale: 1.02, y: -2 }}
			whileTap={{ scale: 0.98 }}
		>
			{/* Icon with circular gradient background */}
			<div
				className={cn(
					'flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-110',
					`bg-linear-to-br ${colorClass}`,
				)}
			>
				<Icon className={cn('h-7 w-7', iconColorClass)} />
			</div>

			{/* Title and description */}
			<div className="text-center">
				<h3 className="mb-1 font-semibold text-sm transition-colors group-hover:text-primary">
					{title}
				</h3>
				<p className="line-clamp-2 text-muted-foreground text-xs">{description}</p>
			</div>

			{/* Arrow indicator */}
			<ChevronRight className="absolute top-3 right-3 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
		</motion.button>
	);

	if (href) {
		return (
			<Link className="relative block" to={href}>
				{content}
			</Link>
		);
	}

	return <div className="relative">{content}</div>;
}

function SettingSection({ title, Icon, colorClass, children, className }: SettingSectionProps) {
	return (
		<motion.div
			className={cn(
				'rounded-2xl border p-5 transition-all duration-300',
				'bg-linear-to-b from-card/80 via-card/60 to-card/40',
				'backdrop-blur-sm',
				'hover:border-primary/20 hover:shadow-xl',
				'shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)]',
				className,
			)}
			transition={{ type: 'spring', stiffness: 300, damping: 25 }}
			variants={fadeInUp}
			whileHover={{ y: -4 }}
		>
			{/* Section Header */}
			<div className="mb-5 flex items-center gap-3">
				<div
					className={cn(
						'flex h-10 w-10 items-center justify-center rounded-lg',
						`bg-linear-to-br ${colorClass}`,
					)}
				>
					<Icon className="h-5 w-5 text-white" />
				</div>
				<h2 className="font-semibold text-lg">{title}</h2>
			</div>

			{/* Items Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
		</motion.div>
	);
}

function SettingsPage() {
	return (
		<div className="w-full p-4 sm:p-6 lg:p-8">
			{/* Header */}
			<motion.div animate={{ opacity: 1, y: 0 }} className="mb-8" initial={{ opacity: 0, y: -20 }}>
				<h1 className="flex items-center gap-3 font-bold text-2xl sm:text-3xl">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-indigo-500">
						<SettingsIcon className="h-5 w-5 text-white" />
					</div>
					Configurações
				</h1>
				<p className="mt-2 text-muted-foreground">Gerencie as configurações do sistema</p>
			</motion.div>

			{/* Bento Grid Layout */}
			<motion.div
				animate="visible"
				className="grid grid-cols-1 gap-6 lg:grid-cols-2"
				initial="hidden"
				variants={staggerContainer}
			>
				{/* Conta - Full Width on Mobile, Half on Desktop */}
				<SettingSection
					className="lg:col-span-2"
					colorClass="from-purple-500 to-purple-600"
					Icon={User}
					title="Conta"
				>
					<SettingItem
						colorClass="from-purple-500/20 to-purple-600/20"
						description="Gerencie suas informações pessoais"
						href="/settings/profile"
						Icon={User}
						iconColorClass="text-purple-500"
						title="Perfil"
					/>
					<SettingItem
						colorClass="from-purple-500/20 to-purple-600/20"
						description="Autenticação e controle de acesso"
						href="/settings/security"
						Icon={Key}
						iconColorClass="text-purple-500"
						title="Segurança"
					/>
					<SettingItem
						colorClass="from-purple-500/20 to-purple-600/20"
						description="Configure alertas e preferências"
						href="/settings/notifications"
						Icon={Bell}
						iconColorClass="text-purple-500"
						title="Notificações"
					/>
				</SettingSection>

				{/* Equipe */}
				<SettingSection colorClass="from-blue-500 to-blue-600" Icon={Users} title="Equipe">
					<SettingItem
						colorClass="from-blue-500/20 to-blue-600/20"
						description="Gerencie usuários e permissões"
						href="/settings/team"
						Icon={Users}
						iconColorClass="text-blue-500"
						title="Membros"
					/>
					<SettingItem
						colorClass="from-blue-500/20 to-blue-600/20"
						description="Configure níveis de acesso"
						href="/settings/roles"
						Icon={Shield}
						iconColorClass="text-blue-500"
						title="Funções e Permissões"
					/>
				</SettingSection>

				{/* Sistema */}
				<SettingSection
					colorClass="from-green-500 to-green-600"
					Icon={SettingsIcon}
					title="Sistema"
				>
					<SettingItem
						colorClass="from-green-500/20 to-green-600/20"
						description="Gerencie etiquetas para leads"
						href="/settings/tags"
						Icon={Tag}
						iconColorClass="text-green-500"
						title="Etiquetas"
					/>
					<SettingItem
						colorClass="from-green-500/20 to-green-600/20"
						description="Gerencie templates para chat"
						href="/settings/templates"
						Icon={FileText}
						iconColorClass="text-green-500"
						title="Templates de Mensagem"
					/>
					<SettingItem
						colorClass="from-green-500/20 to-green-600/20"
						description="Personalize a interface"
						href="/settings/appearance"
						Icon={Palette}
						iconColorClass="text-green-500"
						title="Aparência"
					/>
					<SettingItem
						colorClass="from-green-500/20 to-green-600/20"
						description="Configure campos customizados"
						href="/settings/custom-fields"
						Icon={ListPlus}
						iconColorClass="text-green-500"
						title="Campos Personalizados"
					/>
				</SettingSection>

				{/* Integrações */}
				<SettingSection
					className="lg:col-span-2"
					colorClass="from-orange-500 to-orange-600"
					Icon={Plug}
					title="Integrações"
				>
					<SettingItem
						colorClass="from-orange-500/20 to-orange-600/20"
						description="WhatsApp, Instagram e outros canais"
						href="/settings/integrations"
						Icon={Plug}
						iconColorClass="text-orange-500"
						title="Integrações"
					/>
				</SettingSection>
			</motion.div>
		</div>
	);
}
