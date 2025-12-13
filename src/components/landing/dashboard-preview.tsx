'use client';

import { motion } from 'framer-motion';
import { BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fadeInUp, float, staggerContainer } from '@/lib/animations';

interface PreviewCardProps {
	title: string;
	value: string;
	icon: React.ComponentType<{ className?: string }>;
	delay?: number;
}

function PreviewCard({ title, value, icon: Icon, delay = 0 }: PreviewCardProps) {
	return (
		<motion.div
			variants={float}
			initial="hidden"
			animate="visible"
			transition={{
				delay,
				duration: 3,
				repeat: Infinity,
				ease: 'easeInOut',
			}}
		>
			<Card className="glass-card hover:shadow-xl hover:shadow-primary/20 transition-all duration-300">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
					<Icon className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold font-display">{value}</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

export function DashboardPreview() {
	const previewData = [
		{ title: 'Leads este mês', value: '127', icon: Users },
		{ title: 'Taxa de Conversão', value: '24.5%', icon: TrendingUp },
		{ title: 'Faturamento', value: 'R$ 245k', icon: DollarSign },
		{ title: 'Crescimento', value: '+18%', icon: BarChart3 },
	];

	return (
		<section className="py-24 relative">
			{/* Background overlay */}
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

			<motion.div
				variants={staggerContainer}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: '-100px' }}
				className="container px-4 md:px-6 mx-auto relative z-10"
			>
				<motion.div variants={fadeInUp} className="text-center mb-12">
					<h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
						Veja seu negócio em tempo real
					</h2>
					<p className="font-sans text-muted-foreground text-lg max-w-2xl mx-auto">
						Dashboard completo com métricas atualizadas e insights acionáveis para tomar decisões
						melhores.
					</p>
				</motion.div>

				{/* Glass container */}
				<motion.div
					variants={fadeInUp}
					className="relative max-w-5xl mx-auto"
				>
					<div className="glass-card rounded-2xl p-8 md:p-12">
						{/* Grid of floating cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							{previewData.map((item, index) => (
								<PreviewCard
									key={item.title}
									title={item.title}
									value={item.value}
									icon={item.icon}
									delay={index * 0.2}
								/>
							))}
						</div>

						{/* Chart preview placeholder */}
						<motion.div
							variants={fadeInUp}
							className="mt-8 h-64 rounded-lg bg-gradient-to-br from-primary/10 via-us-purple-light/10 to-us-gold/10 border border-primary/20 flex items-center justify-center"
						>
							<div className="text-center">
								<BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary/50" />
								<p className="text-sm text-muted-foreground font-sans">
									Visualização de dados em tempo real
								</p>
							</div>
						</motion.div>
					</div>
				</motion.div>
			</motion.div>
		</section>
	);
}
