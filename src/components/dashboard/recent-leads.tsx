import type { Doc } from '@convex/_generated/dataModel';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, Flame, Snowflake, Thermometer } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const tempConfig = {
	quente: { icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
	morno: { icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-500/10' },
	frio: { icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-500/10' },
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
	data?: Doc<'leads'>[];
}

export function RecentLeads({ data }: RecentLeadsProps) {
	return (
		<Card className="glass-card">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-display text-2xl font-semibold">Leads Recentes</CardTitle>
				<Link to="/crm">
					<Button variant="ghost" size="sm">
						Ver todos <ArrowRight className="h-4 w-4 ml-1" />
					</Button>
				</Link>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{!data ? (
						<>
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
						</>
					) : data.length > 0 ? (
						data.map((lead) => {
							const TempIcon = tempConfig[lead.temperature].icon;
							return (
								<div
									key={lead._id}
									className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
								>
									<Avatar className="h-9 w-9">
										<AvatarFallback className="text-xs bg-primary/10 text-primary">
											{lead.name
												.split(' ')
												.map((n) => n[0])
												.join('')
												.slice(0, 2)
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">{lead.name}</p>
										<p className="text-xs text-muted-foreground">
											{productLabels[lead.interestedProduct || 'indefinido'] || 'Indefinido'}
										</p>
									</div>
									<div className={cn('p-1.5 rounded-full', tempConfig[lead.temperature].bg)}>
										<TempIcon className={cn('h-3.5 w-3.5', tempConfig[lead.temperature].color)} />
									</div>
									<span className="text-xs text-muted-foreground">
										{formatDistanceToNow(lead.createdAt, { addSuffix: true, locale: ptBR })}
									</span>
								</div>
							);
						})
					) : (
						<p className="text-sm text-muted-foreground text-center py-4">
							Nenhum lead recente encontrado
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
