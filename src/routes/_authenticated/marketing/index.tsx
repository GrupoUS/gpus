import { createFileRoute } from '@tanstack/react-router';
import { FileText, Mail, Plus, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/marketing/')({
	component: MarketingIndexPage,
});

function MarketingIndexPage() {
	const navigate = Route.useNavigate();

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Campanhas</CardTitle>
						<Mail className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">Total de campanhas</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">Aguardando envio</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Enviadas</CardTitle>
						<Send className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">Campanhas concluídas</p>
					</CardContent>
				</Card>
			</div>

			{/* Empty State */}
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-16">
					<Mail className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">Nenhuma campanha ainda</h3>
					<p className="text-muted-foreground text-center mb-6 max-w-md">
						Crie sua primeira campanha de email para engajar seus alunos e leads.
					</p>
					<Button onClick={() => navigate({ to: '/marketing/nova' })}>
						<Plus className="mr-2 h-4 w-4" />
						Nova Campanha
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
