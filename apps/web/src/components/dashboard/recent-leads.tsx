import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, Flame, Snowflake, Thermometer } from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types/api';

const tempConfig = {
	quente: { icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
	morno: { icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-500/10' },
	frio: { icon: Snowflake, color: 'text-primary', bg: 'bg-primary/10' },
} as const;

const productLabels: Record<string, string> = {
	trintae3: 'TRINTAE3',
	black_neon: 'Black NEON',
	comunidade: 'Comunidade US',
	otb: 'OTB MBA',
	auriculo: 'Aurículo',
	na_mesa_certa: 'Na Mesa Certa',
	indefinido: 'Indefinido',
};

interface RecentLeadsProps {
	data?: Lead[];
}

export function RecentLeads({ data }: RecentLeadsProps) {
	let content: ReactNode = null;

	if (!data) {
		content = (
			<>
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-16 w-full" />
			</>
		);
	} else if (data.length === 0) {
		content = (
			<p className="py-4 text-center text-muted-foreground text-sm">
				Nenhum lead recente encontrado
			</p>
		);
	} else {
		content = data.map((lead) => {
			const temp = (lead as any).temperature ?? 'frio';
			const TempIcon = tempConfig[temp as keyof typeof tempConfig]?.icon ?? tempConfig.frio.icon;
			return (
				<div
					className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
					key={lead.id}
				>
					<Avatar className="h-9 w-9">
						<AvatarFallback className="bg-primary/10 text-primary text-xs">
							{lead.name
								.split(' ')
								.map((n) => n[0])
								.join('')
								.slice(0, 2)
								.toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium text-sm">{lead.name}</p>
						<p className="text-muted-foreground text-xs">
							{productLabels[lead.interestedProduct || 'indefinido'] || 'Indefinido'}
						</p>
					</div>
					<div
						className={cn('rounded-full p-1.5', tempConfig[temp as keyof typeof tempConfig]?.bg)}
					>
						<TempIcon
							className={cn('h-3.5 w-3.5', tempConfig[temp as keyof typeof tempConfig]?.color)}
						/>
					</div>
					<span className="text-muted-foreground text-xs">
						{formatDistanceToNow(lead.createdAt, { addSuffix: true, locale: ptBR })}
					</span>
				</div>
			);
		});
	}

	return (
		<Card className="glass-card">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-display font-semibold text-2xl">Leads Recentes</CardTitle>
				<Link to="/crm">
					<Button size="sm" variant="ghost">
						Ver todos <ArrowRight className="ml-1 h-4 w-4" />
					</Button>
				</Link>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">{content}</div>
			</CardContent>
		</Card>
	);
}
