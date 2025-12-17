import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/marketing/$campaignId')({
	component: CampaignDetailPage,
});

function CampaignDetailPage() {
	const { campaignId } = Route.useParams();
	const navigate = Route.useNavigate();

	return (
		<div className="space-y-6">
			<Button
				variant="ghost"
				onClick={() =>
					navigate({
						to: '/marketing',
						search: { search: '', status: 'all', view: 'grid', page: 1 },
					})
				}
			>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Voltar para campanhas
			</Button>

			<Card>
				<CardHeader>
					<CardTitle>Detalhes da Campanha</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						ID da campanha: <code className="bg-muted px-2 py-1 rounded">{campaignId}</code>
					</p>
					<p className="text-muted-foreground mt-4">
						Esta página será implementada em breve com os detalhes completos da campanha.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
