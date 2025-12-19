import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/marketing/')({
	beforeLoad: () => {
		throw redirect({
			to: '/marketing/dashboard',
		});
	},
});
