import { createFileRoute, Outlet, useNavigate, useParams } from '@tanstack/react-router';
import { MessageSquare, Search, Settings } from 'lucide-react';
import { createContext, useContext, useState } from 'react';

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

export const Route = createFileRoute('/_authenticated/chat')({
	component: ChatLayout,
});

// Context to pass filters to children
interface ChatContextType {
	search: string;
	statusFilter: string;
}

const ChatContext = createContext<ChatContextType>({ search: '', statusFilter: 'all' });

export const useChatContext = () => useContext(ChatContext);

function ChatLayout() {
	const navigate = useNavigate();
	// biome-ignore lint/suspicious/noExplicitAny: Params type from Tanstack Router can be vague
	const params = Route.useParams() as any;
	const currentDepartment = params.department || 'vendas';

	// biome-ignore lint/suspicious/noExplicitAny: Check if id exists
	const routeMatch = useParams({ strict: false }) as any;
	const isConversationOpen = !!routeMatch.id;

	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [search, setSearch] = useState('');

	return (
		<ChatContext.Provider value={{ search, statusFilter }}>
			<div className="flex h-[calc(100vh-64px)] overflow-hidden">
				{/* Sidebar */}
				<div
					className={cn(
						'w-80 border-r flex flex-col bg-background/50 shrink-0',
						isConversationOpen ? 'hidden md:flex' : 'flex w-full md:w-80',
					)}
				>
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

						<Tabs
							value={currentDepartment}
							// biome-ignore lint/suspicious/noExplicitAny: Route path dynamic
							onValueChange={(val) => navigate({ to: `/chat/${val}` as any })}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="vendas">Vendas</TabsTrigger>
								<TabsTrigger value="cs">CS</TabsTrigger>
								<TabsTrigger value="suporte">Suporte</TabsTrigger>
							</TabsList>
						</Tabs>

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

					{/* Conversation List Slot */}
					{/* biome-ignore lint/a11y/useValidAnchor: This is a portal target */}
					<div
						id="conversation-list-portal"
						className="flex-1 overflow-hidden relative flex flex-col"
					>
						{/* The list will be portaled here from $department.tsx */}
					</div>
				</div>

				{/* Main Content */}
				<div
					className={cn(
						'flex-1 flex flex-col min-w-0 bg-background',
						!isConversationOpen ? 'hidden md:flex' : 'flex',
					)}
				>
					<Outlet />
				</div>
			</div>
		</ChatContext.Provider>
	);
}
