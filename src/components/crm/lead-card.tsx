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
		_id: string;
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
			variant="glass"
			className="p-3 cursor-grab active:cursor-grabbing lead-card will-change-transform"
			whileHover={{
				scale: 1.02,
				boxShadow: '0 20px 40px -12px hsl(var(--primary) / 0.3)',
			}}
			whileTap={{ scale: 0.98 }}
			transition={SPRING_SMOOTH}
		>
			<div className="flex items-start gap-3">
				<Avatar className="h-9 w-9 lead-avatar">
					<AvatarFallback className="text-xs bg-primary/10 text-primary font-display">
						{lead.name
							.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2)}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<p className="font-medium text-sm truncate font-sans">{lead.name}</p>
						<motion.span
							variants={hotIconVariants}
							initial="idle"
							animate={isHot ? 'hot' : 'idle'}
							className="shrink-0"
						>
							<TempIcon
								className={`h-3.5 w-3.5 temperature-icon ${isHot ? 'hot' : ''} ${temperatureIcons[lead.temperature]?.color || 'text-muted-foreground'}`}
							/>
						</motion.span>
					</div>
					{lead.profession && (
						<p className="text-xs text-muted-foreground truncate">{lead.profession}</p>
					)}
					{lead.clinicName && (
						<p className="text-xs text-muted-foreground truncate flex items-center gap-1">
							<Building className="h-3 w-3" />
							{lead.clinicName}
						</p>
					)}
					<div className="flex items-center gap-2 mt-2">
						{lead.interestedProduct && (
							<Badge variant="outline" className="text-[10px] px-1.5 py-0">
								{productLabels[lead.interestedProduct] || lead.interestedProduct}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-3 mt-2 text-muted-foreground">
						{/* Botão de ligar - usando div com role=button para acessibilidade */}
						<div
							role="button"
							tabIndex={0}
							onClick={(e) => {
								e.stopPropagation();
								// Lógica de ligar aqui
							}}
							className="action-button hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
							aria-label="Ligar"
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									// Lógica de ligar aqui
								}
							}}
						>
							<Phone className="h-4 w-4" />
						</div>
						{/* Botão de mensagem - usando div com role=button para acessibilidade */}
						<div
							role="button"
							tabIndex={0}
							onClick={(e) => {
								e.stopPropagation();
								// Lógica de mensagem aqui
							}}
							className="action-button hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
							aria-label="Mensagem"
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									// Lógica de mensagem aqui
								}
							}}
						>
							<MessageSquare className="h-4 w-4" />
						</div>
						{lead.lastContactAt && (
							<motion.span
								className="text-[10px] ml-auto font-sans"
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
							>
								{formatDistanceToNow(lead.lastContactAt, {
									addSuffix: true,
									locale: ptBR,
								})}
							</motion.span>
						)}
					</div>
				</div>
			</div>
		</MotionCard>
	);
}
