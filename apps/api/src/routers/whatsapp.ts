import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure, router } from '../_core/trpc';

export const whatsappRouter = router({
	/** Send a WhatsApp message */
	sendMessage: protectedProcedure
		.input(
			z.object({
				phone: z.string().min(1),
				message: z.string().min(1),
				leadId: z.number().optional(),
			}),
		)
		.mutation(({ ctx }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			// TODO: Integrate with Evolution API / Baileys
			return {
				success: true,
				messageId: `msg_${Date.now()}`,
				status: 'queued' as const,
			};
		}),

	/** Get WhatsApp connection settings */
	getSettings: protectedProcedure.query(({ ctx }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) {
			throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
		}

		// TODO: Fetch from settings table
		return {
			connected: false,
			instanceName: null as string | null,
			qrCode: null as string | null,
		};
	}),
});
