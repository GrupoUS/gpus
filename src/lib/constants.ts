// Product labels for enrollments
export const productLabels: Record<string, string> = {
	trintae3: 'TRINTAE3',
	otb: 'OTB MBA',
	black_neon: 'Black NEON',
	comunidade: 'Comunidade US',
	auriculo: 'Aurículo',
	na_mesa_certa: 'Na Mesa Certa',
};

// Student status labels
export const studentStatusLabels: Record<string, string> = {
	ativo: 'Ativo',
	inativo: 'Inativo',
	pausado: 'Pausado',
	formado: 'Formado',
};

// Student status badge variants
export const studentStatusVariants: Record<
	string,
	'default' | 'secondary' | 'destructive' | 'outline'
> = {
	ativo: 'default',
	inativo: 'secondary',
	pausado: 'outline',
	formado: 'default',
};

// Enrollment status labels
export const enrollmentStatusLabels: Record<string, string> = {
	ativo: 'Ativo',
	concluido: 'Concluído',
	cancelado: 'Cancelado',
	pausado: 'Pausado',
	aguardando_inicio: 'Aguardando Início',
};

// Payment status labels
export const paymentStatusLabels: Record<string, string> = {
	em_dia: 'Em dia',
	atrasado: 'Atrasado',
	quitado: 'Quitado',
	cancelado: 'Cancelado',
};

// Conversation status labels
export const conversationStatusLabels: Record<string, string> = {
	aguardando_atendente: 'Aguardando',
	em_atendimento: 'Em Atendimento',
	aguardando_cliente: 'Aguardando Cliente',
	resolvido: 'Resolvido',
	bot_ativo: 'Bot Ativo',
};

// Churn risk colors
export const churnRiskColors: Record<string, string> = {
	baixo: 'text-green-500',
	medio: 'text-yellow-500',
	alto: 'text-red-500',
};

// Product colors for UI
export const productColors: Record<string, { color: string; bg: string }> = {
	trintae3: { color: 'bg-[#3B82F6]', bg: 'bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20' },
	otb: { color: 'bg-[#10B981]', bg: 'bg-[#10B981]/10 hover:bg-[#10B981]/20' },
	black_neon: { color: 'bg-[#F59E0B]', bg: 'bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20' },
	comunidade: { color: 'bg-[#EF4444]', bg: 'bg-[#EF4444]/10 hover:bg-[#EF4444]/20' },
	auriculo: { color: 'bg-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20' },
	na_mesa_certa: { color: 'bg-[#EC4899]', bg: 'bg-[#EC4899]/10 hover:bg-[#EC4899]/20' },
	sem_produto: { color: 'bg-gray-500', bg: 'bg-gray-500/10 hover:bg-gray-500/20' },
};

// Currency formatter for BRL
export const formatCurrency = (value: number): string =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value);
