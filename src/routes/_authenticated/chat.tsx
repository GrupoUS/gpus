import { createFileRoute } from '@tanstack/react-router';
import { MessageSquare, Search, Settings } from 'lucide-react';
import { useState } from 'react';

import type { Id } from '../../../convex/_generated/dataModel';
import { AIChatWidget } from '@/components/chat/ai-chat-widget';
import { ChatWindow } from '@/components/chat/chat-window';
import { ConversationList } from '@/components/chat/conversation-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/_authenticated/chat')({
	component: ChatPage,
});

function ChatPage() {
	const [selectedConversation, setSelectedConversation] = useState<Id<'conversations'> | null>(
		null,
	);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [search, setSearch] = useState('');

	return (
		<div className="h-[calc(100vh-64px)] flex flex-col">
			<div className="flex-1 flex min-h-0">
				{/* Sidebar - Conversation List */}
				<div className="w-80 border-r flex flex-col bg-background/50">
					{/* Header */}
					<div className="p-4 border-b space-y-3">
						<div className="flex items-center justify-between">
							<h1 className="text-lg font-bold flex items-center gap-2">
								<MessageSquare className="h-5 w-5 text-purple-500" />
								Chat
							</h1>
							<Button variant="ghost" size="icon">
								<Settings className="h-4 w-4" />
							</Button>
						</div>

						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar conversas..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9"
							/>
						</div>

						{/* Status Filter */}
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Filtrar por status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="aguardando_atendente">Abertos</SelectItem>
								<SelectItem value="em_atendimento">Em Atendimento</SelectItem>
								<SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
								<SelectItem value="resolvido">Resolvidos</SelectItem>
								<SelectItem value="bot_ativo">Bot Ativo</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Conversations */}
					<ConversationList
						selectedId={selectedConversation}
						onSelect={setSelectedConversation}
						statusFilter={statusFilter === 'all' ? undefined : statusFilter}
					/>
				</div>

				{/* Main Chat Area */}
				<div className="flex-1">
					{selectedConversation ? (
						<ChatWindow
							conversationId={selectedConversation}
							onBack={() => setSelectedConversation(null)}
						/>
					) : (
						<div className="h-full flex flex-col items-center justify-center text-muted-foreground">
							<MessageSquare className="h-16 w-16 mb-4 opacity-30" />
							<h2 className="text-lg font-medium">Selecione uma conversa</h2>
							<p className="text-sm">Escolha uma conversa da lista para começar</p>
						</div>
					)}
				</div>
			</div>

			{/* AI Assistant Widget */}
			<AIChatWidget
				conversationId={selectedConversation}
				onInsertResponse={(text) => {
					// TODO: Implement insert into chat input
					console.log('Insert response:', text);
				}}
			/>
		</div>
	);
}
