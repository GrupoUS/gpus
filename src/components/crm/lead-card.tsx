import { useDraggable } from '@dnd-kit/core';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Flame, MessageSquare, Phone, Snowflake, Thermometer } from 'lucide-react';

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
	};
}

const temperatureIcons: Record<string, { icon: any; color: string }> = {
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
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: lead._id,
	});

	// Safe fallback if temp is invalid
	const TempIcon = temperatureIcons[lead.temperature]?.icon || Thermometer;

	const style = transform
		? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
		: undefined;

	return (
		<Card
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
		>
			<div className="flex items-start gap-3">
				<Avatar className="h-9 w-9">
					<AvatarFallback className="text-xs bg-primary/10 text-primary">
						{lead.name
							.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2)}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<p className="font-medium text-sm truncate">{lead.name}</p>
						<TempIcon
							className={`h-3.5 w-3.5 flex-shrink-0 ${temperatureIcons[lead.temperature]?.color || 'text-gray-500'}`}
						/>
					</div>
					{lead.profession && (
						<p className="text-xs text-muted-foreground truncate">{lead.profession}</p>
					)}
					<div className="flex items-center gap-2 mt-2">
						{lead.interestedProduct && (
							<Badge variant="outline" className="text-[10px] px-1.5 py-0">
								{productLabels[lead.interestedProduct] || lead.interestedProduct}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-3 mt-2 text-muted-foreground">
						<button className="hover:text-primary transition-colors">
							<Phone className="h-3.5 w-3.5" />
						</button>
						<button className="hover:text-primary transition-colors">
							<MessageSquare className="h-3.5 w-3.5" />
						</button>
						{lead.lastContactAt && (
							<span className="text-[10px] ml-auto">
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
