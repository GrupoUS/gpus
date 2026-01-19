import type { Id } from '@convex/_generated/dataModel';
import { createFileRoute, Link, Outlet, useMatches } from '@tanstack/react-router';
import { MessageSquare, Search, Settings } from 'lucide-react';
import { createContext, useContext, useId, useState } from 'react';

import { AIChatWidget } from '@/components/chat/ai-chat-widget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Chat context for shared state between parent and child routes
interface ChatContextValue {
	search: string;
	statusFilter: string;
	setSearch: (value: string) => void;
	setStatusFilter: (value: string) => void;
	portalTargetId: string;
	pendingMessage: string;
	setPendingMessage: (value: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error('useChatContext must be used within ChatPage');
	}
	return context;
}

export const Route = createFileRoute('/_authenticated/chat')({
	component: ChatPage,
});

// Department tabs configuration
const departments = [
	{ id: 'vendas', label: 'Vendas' },
	{ id: 'cs', label: 'CS' },
	{ id: 'suporte', label: 'Suporte' },
] as const;

function ChatPage() {
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [search, setSearch] = useState('');
	const [pendingMessage, setPendingMessage] = useState('');
	const portalTargetId = useId();

	// Get the current department and conversation id from the route matches
	const matches = useMatches();
	const departmentMatch = matches.find((m) => m.params && 'department' in m.params);
	const currentDepartment =
		(departmentMatch?.params as { department?: string })?.department || 'vendas';

	// Extract conversation ID from route params
	const conversationMatch = matches.find((m) => m.params && 'id' in m.params);
	const selectedConversationId = (conversationMatch?.params as { id?: string })?.id || null;

	return (
		<ChatContext.Provider
			value={{
				search,
				statusFilter,
				setSearch,
				setStatusFilter,
				portalTargetId,
				pendingMessage,
				setPendingMessage,
			}}
		>
			<div className="flex h-[calc(100vh-64px)] flex-col">
				<div className="flex min-h-0 flex-1">
					{/* Sidebar - Conversation List */}
					<div className="flex w-80 flex-col border-r bg-background/50">
						{/* Header */}
						<div className="space-y-3 border-b p-4">
							<div className="flex items-center justify-between">
								<h1 className="flex items-center gap-2 font-bold text-lg">
									<MessageSquare className="h-5 w-5 text-purple-500" />
									Chat
								</h1>
								<Button size="icon" variant="ghost">
									<Settings className="h-4 w-4" />
								</Button>
							</div>

							{/* Department Tabs */}
							<Tabs value={currentDepartment}>
								<TabsList className="grid w-full grid-cols-3">
									{departments.map((dept) => (
										<TabsTrigger asChild key={dept.id} value={dept.id}>
											<Link
												className={cn('data-[state=active]:bg-background')}
												params={{ department: dept.id }}
												to="/chat/$department"
											>
												{dept.label}
											</Link>
										</TabsTrigger>
									))}
								</TabsList>
							</Tabs>

							{/* Search */}
							<div className="relative">
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									className="pl-9"
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Buscar conversas..."
									value={search}
								/>
							</div>

							{/* Status Filter */}
							<Select onValueChange={setStatusFilter} value={statusFilter}>
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

						{/* Portal target for ConversationList rendered by child routes */}
						<div className="min-h-0 flex-1" id={portalTargetId} />
					</div>

					{/* Main Chat Area - Child routes render here */}
					<div className="flex-1">
						<Outlet />
					</div>
				</div>

				{/* AI Assistant Widget - only shown when a conversation is selected */}
				{selectedConversationId && (
					<AIChatWidget
						conversationId={selectedConversationId as Id<'conversations'>}
						onInsertResponse={(text) => {
							setPendingMessage(text);
						}}
					/>
				)}
			</div>
		</ChatContext.Provider>
	);
}
