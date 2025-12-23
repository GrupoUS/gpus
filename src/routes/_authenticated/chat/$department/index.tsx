import { createFileRoute } from '@tanstack/react-router';
import { MessageSquare } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/chat/$department/')({
	component: ConversationIndex,
});

function ConversationIndex() {
	return (
		<div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-500">
			<div className="bg-muted/50 p-4 rounded-full mb-4">
				<MessageSquare className="h-12 w-12 opacity-50" />
			</div>
			<h2 className="text-xl font-semibold text-foreground mb-2">Selecione uma conversa</h2>
			<p className="text-sm max-w-sm">
				Escolha uma conversa da lista lateral para iniciar o atendimento ou visualizar o histórico.
			</p>
		</div>
	);
}
