'use client';

import { motion } from 'framer-motion';
import { BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MacbookScreenContent, MacbookScroll } from '@/components/ui/macbook-scroll';
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
				repeat: Number.POSITIVE_INFINITY,
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

/**
 * DashboardContent - Internal component that renders the dashboard metrics
 * and chart placeholder inside the MacBook screen.
 */
function DashboardContent() {
	const previewData = [
		{ title: 'Leads este mês', value: '127', icon: Users },
		{ title: 'Taxa de Conversão', value: '24.5%', icon: TrendingUp },
		{ title: 'Faturamento', value: 'R$ 245k', icon: DollarSign },
		{ title: 'Crescimento', value: '+18%', icon: BarChart3 },
	];

	return (
		<MacbookScreenContent className="bg-background/95">
			{/* Grid of floating cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
				initial="hidden"
				animate="visible"
				className="mt-4 md:mt-6 h-32 md:h-48 lg:h-56 rounded-lg bg-gradient-to-br from-primary/10 via-us-purple-light/10 to-us-gold/10 border border-primary/20 flex items-center justify-center"
			>
				<div className="text-center">
					<BarChart3 className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-2 md:mb-3 text-primary/50" />
					<p className="text-xs md:text-sm text-muted-foreground font-sans">
						Visualização de dados em tempo real
					</p>
				</div>
			</motion.div>
		</MacbookScreenContent>
	);
}

export function DashboardPreview() {
	return (
		<section className="py-16 md:py-24 relative overflow-hidden">
			{/* Background overlay */}
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

			<motion.div
				variants={staggerContainer}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: '-100px' }}
				className="container px-4 md:px-6 mx-auto relative z-10"
			>
				<motion.div variants={fadeInUp} className="text-center mb-8 md:mb-12">
					<h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
						Veja seu negócio em tempo real
					</h2>
					<p className="font-sans text-muted-foreground text-lg max-w-2xl mx-auto">
						Dashboard completo com métricas atualizadas e insights acionáveis para tomar decisões
						melhores.
					</p>
				</motion.div>

				{/* MacBook with Dashboard Content */}
				<motion.div variants={fadeInUp}>
					<MacbookScroll showGradient>
						<DashboardContent />
					</MacbookScroll>
				</motion.div>
			</motion.div>
		</section>
	);
}
