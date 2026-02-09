import { Loader2, MessageSquare, Send } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { toast } from 'sonner';

import { trpc } from '../../lib/trpc';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface WhatsAppDialogProps {
	leadId: number;
	leadName: string;
	leadPhone: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WhatsAppDialog({
	leadId,
	leadName,
	leadPhone,
	open,
	onOpenChange,
}: WhatsAppDialogProps) {
	const [message, setMessage] = useState('');
	const [isSending, setIsSending] = useState(false);
	const messageId = useId();

	// TODO: Replace with trpc.messageTemplates.listTemplates.useQuery once router exists
	const templates = undefined as { id: string; name: string; content: string }[] | undefined;
	// @ts-expect-error - Migration: error TS2339
	const sendWhatsAppMutation = trpc.whatsapp.sendMessage.useMutation();

	const handleSend = async () => {
		if (!message.trim()) {
			toast.error('A mensagem não pode estar vazia.');
			return;
		}

		try {
			setIsSending(true);
			const result = await sendWhatsAppMutation.mutateAsync({
				leadId,
				message,
			});

			if (result.success) {
				toast.success('Mensagem enviada com sucesso!');
				setMessage('');
				onOpenChange(false);
			} else {
				toast.error(result.message || 'Erro ao enviar mensagem.');
			}
		} catch (_error) {
			toast.error('Ocorreu um erro ao enviar a mensagem.');
		} finally {
			setIsSending(false);
		}
	};

	const applyTemplate = (content: string) => {
		// Replace variables if needed, for now just simplistic
		const personalizedMessage = content.replace('{{name}}', leadName.split(' ')[0]);
		setMessage(personalizedMessage);
	};

	let templatesContent: ReactNode;
	if (!templates || templates.length === 0) {
		templatesContent = (
			<span className="text-muted-foreground text-xs">Nenhum modelo disponível</span>
		);
	} else {
		templatesContent = templates.slice(0, 5).map((template) => (
			<Button
				className="h-7 text-xs"
				key={template.id}
				onClick={() => applyTemplate(template.content)}
				size="sm"
				variant="outline"
			>
				{template.name}
			</Button>
		));
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<MessageSquare className="h-5 w-5 text-green-600" />
						Enviar Mensagem WhatsApp
					</DialogTitle>
					<DialogDescription>
						Para: <span className="font-medium text-foreground">{leadName}</span> ({leadPhone})
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<p className="font-medium text-muted-foreground text-sm">Modelos Rápidos</p>
						<div className="flex flex-wrap gap-2">{templatesContent}</div>
					</div>

					<div className="space-y-2">
						<label className="font-medium text-muted-foreground text-sm" htmlFor={messageId}>
							Mensagem
						</label>
						<Textarea
							className="min-h-[150px] resize-none"
							id={messageId}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Digite sua mensagem aqui..."
							value={message}
						/>
						<div className="flex justify-end">
							<span
								className={`text-xs ${message.length > 1000 ? 'text-red-500' : 'text-muted-foreground'}`}
							>
								{message.length} caracteres
							</span>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button disabled={isSending} onClick={() => onOpenChange(false)} variant="ghost">
						Cancelar
					</Button>
					<Button className="gap-2" disabled={isSending || !message.trim()} onClick={handleSend}>
						{isSending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Send className="h-4 w-4" />
						)}
						Enviar Mensagem
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
