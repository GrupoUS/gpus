import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
	frio: { icon: Snowflake, color: 'text-blue-500' },
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

export function LeadCard({ lead }: LeadCardProps) {
	// Safe fallback if temp is invalid
	const TempIcon = temperatureIcons[lead.temperature]?.icon || Thermometer;
	const isHot = lead.temperature === 'quente';

	return (
		<Card
			variant="glass"
			className="p-3 cursor-grab active:cursor-grabbing lead-card transition-all duration-200 ease-out hover:shadow-[0_12px_24px_-8px_hsl(var(--primary)/0.2)]"
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
						<TempIcon
							className={`h-3.5 w-3.5 shrink-0 temperature-icon ${isHot ? 'hot' : ''} ${temperatureIcons[lead.temperature]?.color || 'text-gray-500'}`}
						/>
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
						<button
							type="button"
							className="action-button hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
							aria-label="Ligar"
						>
							<Phone className="h-4 w-4" />
						</button>
						<button
							type="button"
							className="action-button hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
							aria-label="Mensagem"
						>
							<MessageSquare className="h-4 w-4" />
						</button>
						{lead.lastContactAt && (
							<span className="text-[10px] ml-auto font-sans animate-fade-in-up">
								{formatDistanceToNow(lead.lastContactAt, {
									addSuffix: true,
									locale: ptBR,
								})}
							</span>
						)}
					</div>
				</div>
			</div>
		</Card>
	);
}
