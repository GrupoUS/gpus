'use client';

import { motion } from 'framer-motion';
import { BarChart3, BrainCircuit, MessageSquareText, ShieldCheck, Users, Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export const features = [
	{
		title: 'AI Lead Scoring',
		description:
			'Inteligência artificial para classificar e priorizar seus leads mais qualificados.',
		icon: BrainCircuit,
		color: 'text-primary',
		bgColor: 'bg-primary/10',
	},
	{
		title: 'Omnichannel Chat',
		description: 'Converse com seus clientes em múltiplos canais de forma integrada.',
		icon: MessageSquareText,
		color: 'text-us-gold',
		bgColor: 'bg-us-gold/10',
	},
	{
		title: 'Predictive Analytics',
		description: 'Análises preditivas para antecendar tendências e oportunidades.',
		icon: BarChart3,
		color: 'text-primary',
		bgColor: 'bg-primary/10',
	},
	{
		title: 'Smart Segmentation',
		description: 'Segmentação inteligente de clientes para campanhas personalizadas.',
		icon: Users,
		color: 'text-us-success',
		bgColor: 'bg-us-success/10',
	},
	{
		title: 'Instant Automation',
		description: 'Automação instantânea de processos repetitivos e workflows.',
		icon: Zap,
		color: 'text-us-warning',
		bgColor: 'bg-us-warning/10',
	},
	{
		title: 'Medical Grade Security',
		description: 'Segurança de nível médico para proteção de dados sensíveis.',
		icon: ShieldCheck,
		color: 'text-us-info',
		bgColor: 'bg-us-info/10',
	},
];

export function Features() {
	return (
		<section className="relative bg-muted/30 py-24">
			<motion.div
				className="container mx-auto px-4 md:px-6"
				initial="hidden"
				variants={staggerContainer}
				viewport={{ once: true, margin: '-100px' }}
				whileInView="visible"
			>
				<motion.div className="mx-auto mb-16 max-w-3xl text-center" variants={fadeInUp}>
					<h2 className="mb-4 font-bold font-display text-3xl tracking-tight md:text-4xl">
						Tudo que você precisa para crescer
					</h2>
					<p className="font-sans text-lg text-muted-foreground">
						Ferramentas poderosas desenhadas para impulsionar seu negócio para o próximo nível.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature) => (
						<motion.div key={feature.title} variants={fadeInUp}>
							<Card className="glass-card group border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10 hover:shadow-xl">
								<CardHeader>
									<div
										className={`h-12 w-12 rounded-lg ${feature.bgColor} mb-4 flex items-center justify-center transition-transform group-hover:scale-110`}
									>
										<feature.icon className={`h-6 w-6 ${feature.color}`} />
									</div>
									<CardTitle className="font-display text-xl">{feature.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="font-sans text-muted-foreground text-sm">{feature.description}</p>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			</motion.div>
		</section>
	);
}
