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

// Currency formatter for BRL
export const formatCurrency = (value: number): string =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value);
