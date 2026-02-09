import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

import type { Context } from './context';

const t = initTRPC.context<Context>().create({
	transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;

// ── Middleware: require authenticated user ──
const requireUser = t.middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Autenticação necessária',
		});
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

// ── Middleware: require admin role ──
const requireAdmin = t.middleware(({ ctx, next }) => {
	if (!ctx.user || (ctx.user.role !== 'admin' && ctx.user.role !== 'owner')) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'Acesso restrito a administradores',
		});
	}
	return next({ ctx });
});

export const adminProcedure = t.procedure.use(requireUser).use(requireAdmin);
