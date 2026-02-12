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
		<div className="max-w-4xl space-y-6 p-6">
			<div>
				<h1 className="flex items-center gap-2 font-bold text-2xl">
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
							className={cn(
								'flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all',
								theme === 'light'
									? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
									: 'border-transparent bg-muted/20 hover:bg-muted/40',
							)}
							onClick={() => setTheme('light')}
							type="button"
						>
							<div className="mb-4 flex h-24 w-full items-center justify-center rounded-lg border bg-white shadow-sm">
								<Sun className="h-8 w-8 text-orange-500" />
							</div>
							<span className="font-medium">Claro</span>
						</button>

						<button
							className={cn(
								'flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all',
								theme === 'dark'
									? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
									: 'border-transparent bg-muted/20 hover:bg-muted/40',
							)}
							onClick={() => setTheme('dark')}
							type="button"
						>
							<div className="mb-4 flex h-24 w-full items-center justify-center rounded-lg border border-slate-800 bg-slate-950 shadow-sm">
								<Moon className="h-8 w-8 text-blue-400" />
							</div>
							<span className="font-medium">Escuro</span>
						</button>

						<button
							className={cn(
								'flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all',
								theme === 'system'
									? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
									: 'border-transparent bg-muted/20 hover:bg-muted/40',
							)}
							onClick={() => setTheme('system')}
							type="button"
						>
							<div className="mb-4 flex h-24 w-full items-center justify-center rounded-lg border bg-linear-to-r from-white to-slate-950 shadow-sm">
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
