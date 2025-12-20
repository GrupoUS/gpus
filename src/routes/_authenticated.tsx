import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { MainLayout } from '@/components/layout/main-layout';
import { useUserSync } from '@/hooks/useUserSync';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated')({
	beforeLoad: ({ context }) => {
		// Wait for Clerk to load before checking auth
		// If auth is undefined or not loaded yet, don't redirect
		// The component will handle the loading state
		if (context.auth?.isLoaded === false) {
			// Still loading, don't redirect yet
			return;
		}
		if (!context.auth?.userId) {
			throw redirect({
				to: '/sign-in',
			});
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	const { status, error, isLoading } = useUserSync();

	if (isLoading) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-muted-foreground text-sm">Sincronizando perfil...</p>
				</div>
			</div>
		);
	}

	if (status === 'error') {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-background p-4">
				<div className="flex max-w-md flex-col items-center gap-6 text-center">
					<div className="space-y-2">
						<h2 className="text-destructive text-xl font-bold">
							Erro de Sincronização
						</h2>
						<p className="text-muted-foreground">
							{error?.message ||
								'Não foi possível sincronizar seu perfil. Por favor, tente novamente.'}
						</p>
					</div>
					<div className="flex gap-4">
						<Button onClick={() => window.location.reload()}>
							Tentar novamente
						</Button>
						<Button
							variant="outline"
							onClick={() => (window.location.href = '/sign-in')}
						>
							Voltar para Login
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<MainLayout>
			<Outlet />
		</MainLayout>
	);
}
