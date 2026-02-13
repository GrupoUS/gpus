import { createFileRoute } from '@tanstack/react-router';
import { MessageSquare } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/chat/$department/')({
	component: ConversationIndex,
});

function ConversationIndex() {
	return (
		<div className="fade-in flex h-full animate-in flex-col items-center justify-center p-8 text-center text-muted-foreground duration-500">
			<div className="mb-4 rounded-full bg-muted/50 p-4">
				<MessageSquare className="h-12 w-12 opacity-50" />
			</div>
			<h2 className="mb-2 font-semibold text-foreground text-xl">Selecione uma conversa</h2>
			<p className="max-w-sm text-sm">
				Escolha uma conversa da lista lateral para iniciar o atendimento ou visualizar o histórico.
			</p>
		</div>
	);
}
