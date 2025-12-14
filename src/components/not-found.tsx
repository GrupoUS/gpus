import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

export function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground space-y-4">
			<h1 className="text-4xl font-bold font-display">404</h1>
			<p className="text-xl text-muted-foreground">Página não encontrada</p>
			<div className="p-4 bg-muted/50 rounded-lg max-w-md break-all text-sm font-mono">
				URL: {typeof window !== 'undefined' ? window.location.href : 'Unknown'}
			</div>
			<Button asChild>
				<Link to="/">Voltar para o início</Link>
			</Button>
		</div>
	);
}
