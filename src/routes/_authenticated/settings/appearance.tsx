import { createFileRoute } from '@tanstack/react-router';
import { Laptop, Moon, Palette, Sun } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/settings/appearance')({
	component: AppearanceSettingsPage,
});

function AppearanceSettingsPage() {
	const { theme, setTheme } = useTheme();

	return (
		<div className="space-y-6 p-6 max-w-4xl">
			<div>
				<h1 className="text-2xl font-bold flex items-center gap-2">
					<Palette className="h-6 w-6 text-purple-500" />
					Aparência
				</h1>
				<p className="text-muted-foreground">Personalize a interface do sistema</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Tema</CardTitle>
					<CardDescription>Escolha como o sistema deve ser exibido.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-3 gap-4">
						<button
							type="button"
							onClick={() => setTheme('light')}
							className={cn(
								'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
								theme === 'light'
									? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
									: 'border-transparent bg-muted/20 hover:bg-muted/40',
							)}
						>
							<div className="h-24 w-full bg-white border rounded-lg mb-4 shadow-sm flex items-center justify-center">
								<Sun className="h-8 w-8 text-orange-500" />
							</div>
							<span className="font-medium">Claro</span>
						</button>

						<button
							type="button"
							onClick={() => setTheme('dark')}
							className={cn(
								'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
								theme === 'dark'
									? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
									: 'border-transparent bg-muted/20 hover:bg-muted/40',
							)}
						>
							<div className="h-24 w-full bg-slate-950 border border-slate-800 rounded-lg mb-4 shadow-sm flex items-center justify-center">
								<Moon className="h-8 w-8 text-blue-400" />
							</div>
							<span className="font-medium">Escuro</span>
						</button>

						<button
							type="button"
							onClick={() => setTheme('system')}
							className={cn(
								'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
								theme === 'system'
									? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
									: 'border-transparent bg-muted/20 hover:bg-muted/40',
							)}
						>
							<div className="h-24 w-full bg-linear-to-r from-white to-slate-950 border rounded-lg mb-4 shadow-sm flex items-center justify-center">
								<Laptop className="h-8 w-8 text-slate-500" />
							</div>
							<span className="font-medium">Sistema</span>
						</button>
					</div>
				</CardContent>
			</Card>

			{/*
      <Card>
          <CardHeader>
              <CardTitle>Densidade</CardTitle>
              <CardDescription>Ajuste o espaçamento dos elementos.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="text-sm text-muted-foreground">Em breve...</div>
          </CardContent>
      </Card>
      */}
		</div>
	);
}
