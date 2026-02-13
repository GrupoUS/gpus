import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Check, Mail, ShieldCheck, Users, X } from 'lucide-react';
import { z } from 'zod';

import { LeadCaptureForm } from '@/components/lead-capture/lead-capture-form';
import { Badge } from '@/components/ui/badge';

const searchSchema = z.object({
	utm_source: z.string().optional(),
	utm_medium: z.string().optional(),
	utm_campaign: z.string().optional(),
	utm_content: z.string().optional(),
	utm_term: z.string().optional(),
});

const structuredData = {
	'@context': 'https://schema.org',
	'@type': 'WebPage',
	name: 'Captura de Leads - GPUS',
	description: 'Transforme sua carreira na estética com conteúdos exclusivos',
	mainEntity: {
		'@type': 'Organization',
		name: 'Grupo US',
		url: 'https://gpus.com.br',
	},
};

export const Route = createFileRoute('/captura/')({
	component: CapturaPage,
	validateSearch: (search) => searchSchema.parse(search),
	head: () => ({
		meta: [
			{ title: 'Transforme sua Carreira na Estética | GPUS' },
			{
				name: 'description',
				content:
					'Receba conteúdos exclusivos e oportunidades de formação. Junte-se a +2.000 profissionais.',
			},
			{ property: 'og:title', content: 'Transforme sua Carreira na Estética | GPUS' },
			{
				property: 'og:description',
				content:
					'Receba conteúdos exclusivos e oportunidades de formação. Junte-se a +2.000 profissionais.',
			},
			{ property: 'og:type', content: 'website' },
			{ property: 'og:url', content: 'https://gpus.com.br/captura' },
			{ name: 'twitter:card', content: 'summary_large_image' },
			{ name: 'twitter:title', content: 'Transforme sua Carreira na Estética | GPUS' },
			{
				name: 'twitter:description',
				content: 'Receba conteúdos exclusivos e oportunidades de formação',
			},
		],
		scripts: [
			{
				type: 'application/ld+json',
				children: JSON.stringify(structuredData),
			},
		],
	}),
});

function CapturaPage() {
	const search = Route.useSearch();

	// Use UTM source if available, otherwise default
	const source = search.utm_source || 'landing_page';

	return (
		<div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
			{/* Background Gradients */}
			<div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
				<div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[128px]" />
				<div className="absolute right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[128px]" />
			</div>

			<div className="container mx-auto max-w-6xl px-4 py-12 md:py-24">
				<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
					{/* Left Column: Copy & Value Prop */}
					<motion.div
						animate={{ opacity: 1, x: 0 }}
						className="space-y-8"
						initial={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.6 }}
					>
						<div className="space-y-4">
							<h1 className="font-bold text-4xl leading-tight tracking-tight md:text-5xl lg:text-6xl">
								Transforme sua <br className="hidden lg:block" />
								<span className="bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
									Carreira na Estética
								</span>
							</h1>
							<p className="max-w-lg text-muted-foreground text-xl leading-relaxed">
								Receba conteúdos exclusivos e oportunidades de formação com a metodologia GPUS.
							</p>
						</div>

						<div className="space-y-4">
							{[
								'Acesso exclusivo a estratégias validadas',
								'Mentoria com especialistas do mercado',
								'Comunidade de alta performance',
							].map((item, i) => (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="flex items-center space-x-3"
									initial={{ opacity: 0, y: 10 }}
									key={i}
									transition={{ delay: 0.2 + i * 0.1 }}
								>
									<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20">
										<Check className="h-4 w-4 text-primary" />
									</div>
									<span className="text-lg">{item}</span>
								</motion.div>
							))}
						</div>

						<div className="flex flex-wrap items-center gap-4 pt-4 text-muted-foreground text-sm">
							<div className="flex items-center space-x-2">
								<ShieldCheck className="h-5 w-5" />
								<span>Seus dados estão protegidos</span>
							</div>
							<div className="flex items-center space-x-2">
								<Mail className="h-5 w-5" />
								<span>Sem spam, prometemos</span>
							</div>
							<div className="flex items-center space-x-2">
								<X className="h-5 w-5" />
								<span>Cancele quando quiser</span>
							</div>
						</div>

						<motion.div
							animate={{ opacity: 1 }}
							initial={{ opacity: 0 }}
							transition={{ delay: 0.5 }}
						>
							<Badge className="px-4 py-2 text-base" variant="secondary">
								<Users className="mr-2 h-4 w-4" />
								Junte-se a +2.000 profissionais
							</Badge>
						</motion.div>
					</motion.div>

					{/* Right Column: Form */}
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="relative"
						initial={{ opacity: 0, y: 20 }}
						transition={{ delay: 0.3, duration: 0.6 }}
					>
						{/* Glow Effect */}
						<div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-purple-500 to-blue-500 opacity-20 blur-lg" />

						<div className="relative rounded-xl border bg-card p-6 shadow-2xl md:p-8">
							<div className="mb-6">
								<h2 className="font-bold text-2xl">Comece Sua Transformação</h2>
								<p className="text-muted-foreground">
									Preencha o formulário e receba conteúdos exclusivos
								</p>
							</div>

							<LeadCaptureForm className="w-full" defaultSource={source} />
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	);
}
