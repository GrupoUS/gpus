'use client';

import { motion } from 'framer-motion';
import { BarChart3, BrainCircuit, MessageSquareText, ShieldCheck, Users, Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const features = [
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
		<section className="py-24 bg-muted/30 relative">
			<motion.div
				variants={staggerContainer}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: '-100px' }}
				className="container px-4 md:px-6 mx-auto"
			>
				<motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
					<h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
						Tudo que você precisa para crescer
					</h2>
					<p className="font-sans text-muted-foreground text-lg">
						Ferramentas poderosas desenhadas para impulsionar seu negócio para o próximo nível.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((feature) => (
						<motion.div key={feature.title} variants={fadeInUp}>
							<Card className="glass-card border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
								<CardHeader>
									<div
										className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
									>
										<feature.icon className={`w-6 h-6 ${feature.color}`} />
									</div>
									<CardTitle className="font-display text-xl">{feature.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="font-sans text-sm text-muted-foreground">{feature.description}</p>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			</motion.div>
		</section>
	);
}
