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
	return (
		<Card className="glass-card">
			<CardHeader>
				<CardTitle className="font-display text-2xl font-semibold">Performance do Time</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{!data ? (
						<>
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
						</>
					) : data.length > 0 ? (
						data.map((member) => (
							<div key={member._id} className="flex items-center gap-3">
								<Avatar className="h-9 w-9">
									<AvatarFallback className="text-xs bg-primary/10 text-primary">
										{member.name
											.split(' ')
											.map((n) => n[0])
											.join('')
											.slice(0, 2)
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{member.name}</p>
									<p className="text-xs text-muted-foreground">{member.role}</p>
								</div>
								<div className="text-right">
									<p className="text-sm font-medium">{member.metric}</p>
									<p className="text-xs text-muted-foreground">{member.metricLabel}</p>
								</div>
							</div>
						))
					) : (
						<p className="text-sm text-muted-foreground text-center py-4">
							Nenhum membro do time encontrado
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
