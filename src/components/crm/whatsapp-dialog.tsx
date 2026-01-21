import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAction, useQuery } from 'convex/react';
import { Loader2, Send } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface WhatsAppDialogProps {
	leadId: Id<'leads'>;
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

	// biome-ignore lint/suspicious/noExplicitAny: Required to break deep type inference chain
	const templates = useQuery((api as any).messageTemplates.listTemplates, { isActive: true });
	// biome-ignore lint/suspicious/noExplicitAny: Required to break deep type inference chain
	const sendWhatsApp = useAction((api as any).whatsapp.sendWhatsAppMessage);

	const handleSend = async () => {
		if (!message.trim()) {
			toast.error('Por favor, digite uma mensagem.');
			return;
		}

		setIsSending(true);
		try {
			const result = (await sendWhatsApp({
				leadId,
				message,
			})) as { success: boolean; message?: string; error?: string };

			if (result.success) {
				toast.success('Mensagem enviada com sucesso!');
				setMessage('');
				onOpenChange(false);
			} else {
				toast.error(result.message || result.error || 'Erro ao enviar mensagem.');
			}
		} catch (_error) {
			toast.error('Erro ao enviar mensagem. Tente novamente.');
		} finally {
			setIsSending(false);
		}
	};

	const handleTemplateClick = (content: string) => {
		// Replace variables if needed, simple replacement for now
		let processedContent = content;
		processedContent = processedContent.replace('{{nome}}', leadName.split(' ')[0]);
		setMessage(processedContent);
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Enviar Mensagem WhatsApp</DialogTitle>
					<DialogDescription>
						Enviando para <strong>{leadName}</strong> ({leadPhone})
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label>Modelos de Mensagem</Label>
						{templates === undefined && (
							<div className="flex h-20 items-center justify-center">
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
							</div>
						)}
						{templates !== undefined && templates.length === 0 && (
							<p className="text-muted-foreground text-sm">Nenhum modelo disponível.</p>
						)}
						{templates !== undefined && templates.length > 0 && (
							<ScrollArea className="h-[120px] rounded-md border p-2">
								<div className="flex flex-wrap gap-2">
									{/* biome-ignore lint/suspicious/noExplicitAny: Dynamic template type */}
									{templates.map((template: any) => (
										<Badge
											className="cursor-pointer hover:bg-primary/90"
											key={template._id}
											onClick={() => handleTemplateClick(template.content)}
											variant="secondary"
										>
											{template.name}
										</Badge>
									))}
								</div>
							</ScrollArea>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor={messageId}>Mensagem</Label>
						<Textarea
							className="h-[150px] resize-none"
							id={messageId}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Digite sua mensagem aqui..."
							value={message}
						/>
						<p className="text-right text-muted-foreground text-xs">{message.length} caracteres</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						disabled={isSending}
						onClick={() => onOpenChange(false)}
						type="button"
						variant="outline"
					>
						Cancelar
					</Button>
					<Button disabled={isSending || !message.trim()} onClick={handleSend}>
						{isSending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Enviando...
							</>
						) : (
							<>
								<Send className="mr-2 h-4 w-4" />
								Enviar Mensagem
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
