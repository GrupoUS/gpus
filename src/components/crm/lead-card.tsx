import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
	Building,
	Flame,
	type LucideIcon,
	MessageSquare,
	Phone,
	Snowflake,
	Thermometer,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { hotIconVariants, SPRING_SMOOTH } from '@/lib/motion-config';

interface LeadCardProps {
	lead: {
		id: number;
		name: string;
		phone: string;
		profession?: string;
		interestedProduct?: string;
		temperature: 'frio' | 'morno' | 'quente';
		lastContactAt?: number;
		clinicName?: string;
		hasClinic?: boolean;
	};
}

const temperatureIcons: Record<string, { icon: LucideIcon; color: string }> = {
	frio: { icon: Snowflake, color: 'text-primary' },
	morno: { icon: Thermometer, color: 'text-yellow-500' },
	quente: { icon: Flame, color: 'text-red-500' },
};

const productLabels: Record<string, string> = {
	trintae3: 'TRINTAE3',
	otb: 'OTB MBA',
	black_neon: 'Black NEON',
	comunidade: 'Comunidade',
	auriculo: 'Aurículo',
	na_mesa_certa: 'Na Mesa Certa',
};

// Create motion-enhanced Card component
const MotionCard = motion.create(Card);

export function LeadCard({ lead }: LeadCardProps) {
	// Safe fallback if temp is invalid
	const TempIcon = temperatureIcons[lead.temperature]?.icon || Thermometer;
	const isHot = lead.temperature === 'quente';

	return (
		<MotionCard
			className="lead-card cursor-grab p-3 will-change-transform active:cursor-grabbing"
			transition={SPRING_SMOOTH}
			variant="glass"
			whileHover={{
				scale: 1.02,
				boxShadow: '0 20px 40px -12px hsl(var(--primary) / 0.3)',
			}}
			whileTap={{ scale: 0.98 }}
		>
			<div className="flex items-start gap-3">
				<Avatar className="lead-avatar h-9 w-9">
					<AvatarFallback className="bg-primary/10 font-display text-primary text-xs">
						{lead.name
							.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2)}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<p className="truncate font-medium font-sans text-sm">{lead.name}</p>
						<motion.span
							animate={isHot ? 'hot' : 'idle'}
							className="shrink-0"
							initial="idle"
							variants={hotIconVariants}
						>
							<TempIcon
								className={`temperature-icon h-3.5 w-3.5 ${isHot ? 'hot' : ''} ${temperatureIcons[lead.temperature]?.color || 'text-muted-foreground'}`}
							/>
						</motion.span>
					</div>
					{lead.profession && (
						<p className="truncate text-muted-foreground text-xs">{lead.profession}</p>
					)}
					{lead.clinicName && (
						<p className="flex items-center gap-1 truncate text-muted-foreground text-xs">
							<Building className="h-3 w-3" />
							{lead.clinicName}
						</p>
					)}
					<div className="mt-2 flex items-center gap-2">
						{lead.interestedProduct && (
							<Badge className="px-1.5 py-0 text-[10px]" variant="outline">
								{productLabels[lead.interestedProduct] || lead.interestedProduct}
							</Badge>
						)}
					</div>
					<div className="mt-2 flex items-center gap-3 text-muted-foreground">
						{/* Botão de ligar - usando button para acessibilidade */}
						<button
							aria-label="Ligar"
							className="action-button relative z-10 flex min-h-[44px] min-w-[44px] cursor-pointer appearance-none items-center justify-center border-none bg-transparent transition-colors hover:text-primary"
							onClick={(e) => {
								e.stopPropagation();
								// Lógica de ligar aqui
							}}
							type="button"
						>
							<Phone className="h-4 w-4" />
						</button>
						{/* Botão de mensagem - usando button para acessibilidade */}
						<button
							aria-label="Mensagem"
							className="action-button relative z-10 flex min-h-[44px] min-w-[44px] cursor-pointer appearance-none items-center justify-center border-none bg-transparent transition-colors hover:text-primary"
							onClick={(e) => {
								e.stopPropagation();
								// Lógica de mensagem aqui
							}}
							type="button"
						>
							<MessageSquare className="h-4 w-4" />
						</button>
						{lead.lastContactAt && (
							<motion.span
								animate={{ opacity: 1, y: 0 }}
								className="ml-auto font-sans text-[10px]"
								initial={{ opacity: 0, y: 5 }}
								transition={{ delay: 0.1 }}
							>
								{formatDistanceToNow(lead.lastContactAt, {
									addSuffix: true,
									locale: ptBR,
								})}
							</motion.span>
						)}
					</div>
					<div className="mt-3 flex flex-wrap gap-1">
						<LeadTags leadId={lead.id} />
					</div>
				</div>
			</div>
		</MotionCard>
	);
}

function LeadTags({ leadId }: { leadId: number }) {
	const { data: tags } = trpc.tags.getLeadTags.useQuery({ leadId });

	if (!tags) return null;

	const displayedTags = tags
		.slice(0, 3)
		.filter((tag): tag is NonNullable<typeof tag> => tag !== null);
	const remaining = tags.length - 3;

	return (
		<>
			{displayedTags.map((tag) => (
				<Badge
					className="h-5 px-1.5 text-[10px]"
					key={tag.id}
					style={{
						backgroundColor: tag.color ? `${tag.color}15` : undefined,
						// @ts-expect-error - Migration: error TS2322
						color: tag.color,
						borderColor: tag.color ? `${tag.color}30` : undefined,
						borderWidth: '1px',
					}}
					variant="secondary"
				>
					{tag.name}
				</Badge>
			))}
			{remaining > 0 && (
				<Badge className="h-5 px-1.5 text-[10px] text-muted-foreground" variant="outline">
					+{remaining}
				</Badge>
			)}
		</>
	);
}
