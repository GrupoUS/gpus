import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod';

// Search params schema for marketing routes
const marketingSearchSchema = z.object({
	view: z.enum(['grid', 'list']).optional().default('grid'),
	page: z.number().optional().default(1),
	search: z.string().optional().default(''),
	status: z.enum(['all', 'draft', 'scheduled', 'sent']).optional().default('all'),
});

export const Route = createFileRoute('/_authenticated/marketing')({
	validateSearch: marketingSearchSchema,
	component: MarketingLayout,
});

function MarketingLayout() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Email Marketing</h1>
					<p className="text-muted-foreground">Gerencie suas campanhas de email</p>
				</div>
			</div>
			<Outlet />
		</div>
	);
}
