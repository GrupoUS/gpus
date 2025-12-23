import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/chat/')({
	beforeLoad: () => {
		throw redirect({
			to: '/chat/$department',
			params: { department: 'vendas' },
		});
	},
});
