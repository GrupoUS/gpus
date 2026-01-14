import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Zap } from 'lucide-react';
import { z } from 'zod';

import { LeadForm } from '@/components/lead-form/lead-form';

const searchSchema = z.object({
	utm_source: z.string().optional(),
	utm_medium: z.string().optional(),
	utm_campaign: z.string().optional(),
	utm_content: z.string().optional(),
	utm_term: z.string().optional(),
});

export const Route = createFileRoute('/captura/')({
	component: CapturaPage,
	validateSearch: (search) => searchSchema.parse(search),
});

function CapturaPage() {
	const search = Route.useSearch();

	// Use UTM source if available, otherwise default
	const source = search.utm_source || 'landing_page';

	return (
		<div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
			{/* Background Gradients */}
			<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
				<div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px]" />
				<div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[128px]" />
			</div>

			<div className="container mx-auto px-4 py-12 md:py-24 max-w-6xl">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
					{/* Left Column: Copy & Value Prop */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6 }}
						className="space-y-8"
					>
						<div className="space-y-4">
							<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
								Revolucione sua <br className="hidden lg:block" />
								<span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-blue-400">
									Clínica de Estética
								</span>
							</h1>
							<p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
								Domine gestão, vendas e procedimentos de alta performance com a metodologia GPUS.
							</p>
						</div>

						<div className="space-y-4">
							{[
								'Acesso exclusivo a estratégias validadas',
								'Mentoria com especialistas do mercado',
								'Comunidade de alta performance',
							].map((item, i) => (
								<motion.div
									key={i}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2 + i * 0.1 }}
									className="flex items-center space-x-3"
								>
									<div className="shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
										<Check className="h-4 w-4 text-primary" />
									</div>
									<span className="text-lg">{item}</span>
								</motion.div>
							))}
						</div>

						<div className="pt-4 flex items-center space-x-8 text-sm text-muted-foreground">
							<div className="flex items-center space-x-2">
								<ShieldCheck className="h-5 w-5" />
								<span>Dados Seguros</span>
							</div>
							<div className="flex items-center space-x-2">
								<Zap className="h-5 w-5" />
								<span>Resposta Rápida</span>
							</div>
						</div>
					</motion.div>

					{/* Right Column: Form */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3, duration: 0.6 }}
						className="relative"
					>
						{/* Glow Effect */}
						<div className="absolute -inset-1 bg-linear-to-r from-purple-500 to-blue-500 rounded-2xl opacity-20 blur-lg" />

						<div className="relative bg-card border rounded-xl p-6 md:p-8 shadow-2xl">
							<div className="mb-6">
								<h2 className="text-2xl font-bold">Fale com um Especialista</h2>
								<p className="text-muted-foreground">
									Preencha o formulário para receber o contato.
								</p>
							</div>

							<LeadForm defaultSource={source} className="w-full" />
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	);
}
