import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

interface CampaignFormData {
	name: string;
	subject: string;
	listIds: Id<'emailLists'>[];
	status: CampaignStatus;
	scheduledAt?: number;
}

export const Route = createFileRoute('/_authenticated/marketing/$campaignId/edit')({
	component: EditCampaignPage,
});

function EditCampaignPage() {
	const id = useId();
	const [isPending, setIsPending] = useState(false);
	const navigate = useNavigate();
	const { campaignId } = Route.useParams();

	// Fetch existing campaign data
	const queryArgs = { campaignId: campaignId as Id<'emailCampaigns'> };
	const campaign = useQuery(api.emailMarketing.getCampaign, queryArgs);
	const isLoading = campaign === undefined;

	// Fetch available email lists
	const lists = useQuery(api.emailMarketing.getLists, {});

	// Update campaign mutation
	const updateCampaign = useMutation(api.emailMarketing.updateCampaign);

	// Form state
	const [formData, setFormData] = useState<CampaignFormData>({
		name: '',
		subject: '',
		listIds: [],
		status: 'draft',
	});

	// Initialize form when campaign data is loaded
	useEffect(() => {
		if (campaign) {
			setFormData({
				name: campaign.name,
				subject: campaign.subject || '',
				listIds: campaign.listIds || [],
				status: campaign.status,
			});
		}
	}, [campaign]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!campaign) return;

		setIsPending(true);
		try {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { status: _status, ...updateData } = formData;
			await updateCampaign({
				campaignId: campaign._id,
				...updateData,
			});
			toast.success('Campanha atualizada com sucesso!', {
				description: 'As alterações foram salvas.',
			});
			void navigate({
				to: '/marketing',
				search: { search: '', status: 'all', view: 'grid', page: 1 },
			});
		} catch (error) {
			toast.error('Erro ao atualizar campanha', {
				description:
					error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.',
			});
		} finally {
			setIsPending(false);
		}
	};

	const handleListToggle = (listId: Id<'emailLists'>) => {
		setFormData((prev) => {
			const isSelected = prev.listIds.includes(listId);
			const newList = isSelected
				? prev.listIds.filter((id) => id !== listId)
				: [...prev.listIds, listId];

			return { ...prev, listIds: newList };
		});
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!campaign) {
		return (
			<div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
						<h2 className="font-semibold text-lg">Campanha não encontrada</h2>
						<p className="mt-2 text-muted-foreground text-sm">
							A campanha que você procura não existe ou foi removida.
						</p>
						<Button onClick={() => navigate({ to: '/marketing' })}>Voltar para campanhas</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button onClick={() => navigate({ to: '/marketing' })} size="icon" variant="ghost">
					<ArrowLeft className="mr-2 h-4 w-4" />
				</Button>
				<h1 className="font-bold text-xl">Editar Campanha</h1>
			</div>

			{/* Form */}
			<Card>
				<CardHeader>
					<CardTitle>Informações da Campanha</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-6" onSubmit={handleSubmit}>
						{/* Name */}
						<div className="space-y-2">
							<Label htmlFor={`${id}-name`}>Nome da Campanha</Label>
							<Input
								id={`${id}-name`}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder="Ex: Black Friday 2025"
								required
								type="text"
								value={formData.name}
							/>
						</div>

						{/* Subject */}
						<div className="space-y-2">
							<Label htmlFor={`${id}-subject`}>Assunto</Label>
							<Input
								id={`${id}-subject`}
								onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
								placeholder="Ofertas exclusivas para VIPs"
								required
								type="text"
								value={formData.subject}
							/>
						</div>

						{/* Status */}
						<div className="space-y-2">
							<Label htmlFor={`${id}-status`}>Status</Label>
							<select
								className="w-full"
								id={`${id}-status`}
								onChange={(e) =>
									setFormData({ ...formData, status: e.target.value as CampaignStatus })
								}
								value={formData.status}
							>
								<option value="draft">Rascunho</option>
								<option value="scheduled">Agendada</option>
								<option value="sending">Enviando</option>
								<option value="sent">Enviada</option>
								<option value="failed">Falhou</option>
							</select>
						</div>

						{/* Email Lists */}
						<div className="space-y-2">
							<Label>Selecione as Listas de E-mail</Label>
							{isLoading ? (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<Loader2 className="h-4 w-4 animate-spin" />
									Carregando listas...
								</div>
							) : (
								<div className="space-y-2">
									{lists?.map((list: Doc<'emailLists'>) => (
										<div className="flex items-center gap-3 rounded-lg border p-3" key={list._id}>
											<input
												checked={formData.listIds.includes(list._id)}
												className="h-5 w-5"
												id={`list-${list._id}`}
												onChange={() => handleListToggle(list._id)}
												type="checkbox"
											/>
											<Label className="flex-1 cursor-pointer" htmlFor={`list-${list._id}`}>
												{list.name}
											</Label>
										</div>
									))}
								</div>
							)}
						</div>

						<Separator />

						{/* Actions */}
						<div className="flex items-center justify-end gap-3">
							<Button
								onClick={() => navigate({ to: '/marketing' })}
								type="button"
								variant="outline"
							>
								Cancelar
							</Button>
							<Button disabled={isPending} type="submit">
								{isPending ? (
									<div className="flex items-center gap-2">
										<Loader2 className="h-4 w-4 animate-spin" />
										Salvando...
									</div>
								) : (
									'Salvar Alterações'
								)}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
