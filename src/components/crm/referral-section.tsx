import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Coins, HandCoins, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ReferralSectionProps {
	leadId: Id<'leads'>;
}

type ReferralStats = {
	convertedReferrals: number;
	pendingReferrals: number;
	totalCashback?: number;
	totalReferrals: number;
};

const useQueryUnsafe = useQuery as unknown as (query: unknown, args?: unknown) => unknown;
const apiAny = api as unknown as Record<string, Record<string, unknown>>;

export function ReferralSection({ leadId }: ReferralSectionProps) {
	const lead = useQueryUnsafe(apiAny.leads.getLead, { leadId }) as Doc<'leads'> | null | undefined;
	const referrer = useQueryUnsafe(
		apiAny.leads.getLead,
		lead?.referredById ? { leadId: lead.referredById } : 'skip',
	) as Doc<'leads'> | null | undefined;
	const stats = useQueryUnsafe(apiAny.referrals.getReferralStats, { leadId }) as
		| ReferralStats
		| undefined;

	if (!lead || (!lead.referredById && stats?.totalReferrals === 0)) {
		return null;
	}

	return (
		<section className="space-y-3">
			<h3 className="flex items-center gap-2 font-medium text-muted-foreground text-sm uppercase tracking-wider">
				<HandCoins className="h-4 w-4" /> Indicações & Cashback
			</h3>

			<div className="grid gap-4">
				{/* Case 1: This lead was referred by someone */}
				{lead.referredById && referrer && (
					<Card className="border-l-4 border-l-blue-500 bg-blue-50/20">
						<CardContent className="flex items-center gap-4 p-4">
							<div className="rounded-full bg-blue-100 p-2 text-blue-600">
								<Users className="h-5 w-5" />
							</div>
							<div className="flex-1">
								<p className="text-muted-foreground text-xs">Indicado por</p>
								<p className="font-medium">{referrer.name}</p>
							</div>
							{/* Check if this lead yielded cashback for the referrer */}
							{/* This info is typically on the activities or stored on the lead, assuming 'cashbackPaidAt' from check */}
							{/* Given we don't have lead fields, we skip status here or check lead.cashbackPaidAt if we added it to schema type, but for now just showing referrer is good */}
						</CardContent>
					</Card>
				)}

				{/* Case 2: This lead has referred others */}
				{stats && stats.totalReferrals > 0 && (
					<Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-transparent">
						<CardContent className="p-4">
							<div className="mb-4 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="rounded-full bg-green-100 p-2 text-green-600">
										<Coins className="h-5 w-5" />
									</div>
									<span className="font-medium text-sm">Cashback Acumulado</span>
								</div>
								<Badge className="border-green-200 bg-green-50 text-green-700" variant="outline">
									{stats.convertedReferrals} conversões
								</Badge>
							</div>

							<div className="space-y-1">
								<span className="block font-bold text-2xl text-green-700">
									{stats.totalCashback?.toLocaleString('pt-BR', {
										style: 'currency',
										currency: 'BRL',
									}) ?? 'R$ 0,00'}
								</span>
								<p className="text-muted-foreground text-xs">
									{stats.pendingReferrals} indicações aguardando fechamento
								</p>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</section>
	);
}
