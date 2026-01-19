import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

export function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-background text-foreground">
			<h1 className="font-bold font-display text-4xl">404</h1>
			<p className="text-muted-foreground text-xl">Página não encontrada</p>
			<div className="max-w-md break-all rounded-lg bg-muted/50 p-4 font-mono text-sm">
				URL: {typeof window !== 'undefined' ? window.location.href : 'Unknown'}
			</div>
			<Button asChild>
				<Link to="/">Voltar para o início</Link>
			</Button>
		</div>
	);
}
