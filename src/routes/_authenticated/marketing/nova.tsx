import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/_authenticated/marketing/nova')({
	component: NewCampaignPage,
});

function NewCampaignPage() {
	const navigate = Route.useNavigate();

	return (
		<div className="space-y-6">
			<Button variant="ghost" onClick={() => navigate({ to: '/marketing' })}>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Voltar para campanhas
			</Button>

			<Card>
				<CardHeader>
					<CardTitle>Nova Campanha</CardTitle>
					<CardDescription>
						Crie uma nova campanha de email para seus alunos e leads.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="name">Nome da Campanha</Label>
						<Input id="name" placeholder="Ex: Newsletter Dezembro 2024" />
					</div>

					<div className="space-y-2">
						<Label htmlFor="subject">Assunto do Email</Label>
						<Input id="subject" placeholder="Ex: Novidades do mês!" />
					</div>

					<div className="space-y-2">
						<Label htmlFor="content">Conteúdo</Label>
						<Textarea
							id="content"
							placeholder="Escreva o conteúdo do seu email..."
							className="min-h-[200px]"
						/>
					</div>

					<div className="flex gap-4">
						<Button variant="outline" onClick={() => navigate({ to: '/marketing' })}>
							Cancelar
						</Button>
						<Button disabled>
							<Send className="mr-2 h-4 w-4" />
							Salvar como Rascunho
						</Button>
					</div>

					<p className="text-sm text-muted-foreground">
						* Funcionalidade em desenvolvimento. Em breve você poderá criar e enviar campanhas.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
