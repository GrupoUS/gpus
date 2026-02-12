import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Objection } from '@/types/api';

interface ObjectionFormProps {
	leadId: number;
	objection?: Objection;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function ObjectionForm({
	leadId: _leadId,
	objection,
	onSuccess,
	onCancel,
}: ObjectionFormProps) {
	const [text, setText] = useState(objection?.objectionText || '');
	const [isSubmitting, setIsSubmitting] = useState(false);

	// TODO: Implement objection mutations via tRPC when objectionsRouter is created
	const handleSubmit = async () => {
		if (!text.trim()) return;

		setIsSubmitting(true);
		try {
			// Stub: objections router not implemented yet
			toast.info('Objeções ainda não foram implementadas no novo backend');
			setText('');
			onSuccess?.();
		} catch (_error) {
			toast.error('Erro ao salvar objeção');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-4 rounded-lg border border-border/50 bg-card p-4">
			<Textarea
				className="min-h-[100px]"
				onChange={(e) => setText(e.target.value)}
				placeholder="Descreva a objeção..."
				value={text}
			/>
			<div className="flex justify-end gap-2">
				{onCancel && (
					<Button disabled={isSubmitting} onClick={onCancel} variant="ghost">
						Cancelar
					</Button>
				)}
				<Button disabled={isSubmitting || !text.trim()} onClick={handleSubmit}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{objection ? 'Atualizar' : 'Salvar'}
				</Button>
			</div>
		</div>
	);
}
