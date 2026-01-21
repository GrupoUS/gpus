import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Handshake, Loader2, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReferralSectionProps {
	leadId: Id<'leads'>;
}

interface ReferralStats {
	totalReferrals: number;
	totalCashback: number;
	convertedReferrals: number;
	pendingReferrals: number;
}

interface LeadInfo {
	name: string;
	referredById?: Id<'leads'>;
}

export function ReferralSection({ leadId }: ReferralSectionProps) {
	const useQueryUnsafe = useQuery as unknown as (query: unknown, args?: unknown) => unknown;
	const apiAny = api as unknown as {
		referrals: { getReferralStats: unknown };
		leads: { getLead: unknown };
	};
	const stats = useQueryUnsafe(apiAny.referrals.getReferralStats, { leadId }) as
		| ReferralStats
		| undefined;
	const lead = useQueryUnsafe(apiAny.leads.getLead, { leadId }) as LeadInfo | undefined;
	const referrer = useQueryUnsafe(
		apiAny.leads.getLead,
		lead?.referredById ? { leadId: lead.referredById } : 'skip',
	) as LeadInfo | undefined;

	if (stats === undefined || lead === undefined) {
		return (
			<Card className="border-dashed">
				<CardContent className="flex items-center justify-center py-6">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		);
	}

	const hasReferrals = stats.totalReferrals > 0;
	const isReferred = !!lead.referredById;

	if (!(hasReferrals || isReferred)) {
		return null;
	}

	return (
		<section className="space-y-3">
			<h3 className="flex items-center gap-2 font-medium text-muted-foreground text-sm uppercase tracking-wider">
				<Handshake className="h-4 w-4" /> Indicações
			</h3>

			{isReferred && referrer && (
				<Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Indicado por</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2 font-medium">
							<Users className="h-4 w-4 text-muted-foreground" />
							{referrer.name}
						</div>
					</CardContent>
				</Card>
			)}

			{hasReferrals && (
				<Card className="overflow-hidden border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center justify-between text-base">
							<span>Programa de Indicações</span>
							<span className="text-2xl">🤝</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div>
							<p className="text-muted-foreground text-sm">Cashback Acumulado</p>
							<p className="font-bold text-3xl text-green-700 dark:text-green-400">
								{new Intl.NumberFormat('pt-BR', {
									style: 'currency',
									currency: 'BRL',
								}).format(stats.totalCashback)}
							</p>
						</div>

						<div className="grid grid-cols-3 gap-2 text-center text-sm">
							<div className="rounded bg-background/50 p-2 backdrop-blur-sm">
								<span className="block font-bold text-lg">{stats.totalReferrals}</span>
								<span className="text-muted-foreground text-xs">Total</span>
							</div>
							<div className="rounded bg-background/50 p-2 backdrop-blur-sm">
								<span className="block font-bold text-green-600 text-lg">
									{stats.convertedReferrals}
								</span>
								<span className="text-muted-foreground text-xs">Convertidos</span>
							</div>
							<div className="rounded bg-background/50 p-2 backdrop-blur-sm">
								<span className="block font-bold text-lg text-yellow-600">
									{stats.pendingReferrals}
								</span>
								<span className="text-muted-foreground text-xs">Pendentes</span>
							</div>
						</div>

						{stats.pendingReferrals > 0 && (
							<p className="text-center text-muted-foreground text-xs">
								⏳ {stats.pendingReferrals} indicações aguardando fechamento para gerar cashback.
							</p>
						)}
					</CardContent>
				</Card>
			)}
		</section>
	);
}
