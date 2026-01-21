import type { ReactNode } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TeamMember {
	_id: string;
	name: string;
	role: string;
	metric: number;
	metricLabel: string;
}

interface TeamPerformanceProps {
	data?: TeamMember[];
}

export function TeamPerformance({ data }: TeamPerformanceProps) {
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
				Nenhum membro do time encontrado
			</p>
		);
	} else {
		content = data.map((member) => (
			<div className="flex items-center gap-3" key={member._id}>
				<Avatar className="h-9 w-9">
					<AvatarFallback className="bg-primary/10 text-primary text-xs">
						{member.name
							.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2)
							.toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium text-sm">{member.name}</p>
					<p className="text-muted-foreground text-xs">{member.role}</p>
				</div>
				<div className="text-right">
					<p className="font-medium text-sm">{member.metric}</p>
					<p className="text-muted-foreground text-xs">{member.metricLabel}</p>
				</div>
			</div>
		));
	}

	return (
		<Card className="glass-card">
			<CardHeader>
				<CardTitle className="font-display font-semibold text-2xl">Performance do Time</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">{content}</div>
			</CardContent>
		</Card>
	);
}
