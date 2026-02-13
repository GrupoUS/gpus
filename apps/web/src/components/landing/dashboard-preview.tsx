'use client';

import { motion } from 'framer-motion';
import { BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react';

import { ScrollFloatText } from './scroll-float-text';
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
			animate="visible"
			initial="hidden"
			transition={{
				delay,
				duration: 3,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'easeInOut',
			}}
			variants={float}
		>
			<Card className="glass-card transition-all duration-300 hover:shadow-primary/20 hover:shadow-xl">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="font-medium text-muted-foreground text-sm">{title}</CardTitle>
					<Icon className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent>
					<div className="font-bold font-display text-2xl">{value}</div>
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
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
				{previewData.map((item, index) => (
					<PreviewCard
						delay={index * 0.2}
						icon={item.icon}
						key={item.title}
						title={item.title}
						value={item.value}
					/>
				))}
			</div>

			{/* Chart preview placeholder */}
			<motion.div
				animate="visible"
				className="mt-4 flex h-32 items-center justify-center rounded-lg border border-primary/20 bg-linear-to-br from-primary/10 via-us-purple-light/10 to-us-gold/10 md:mt-6 md:h-48 lg:h-56"
				initial="hidden"
				variants={fadeInUp}
			>
				<div className="text-center">
					<BarChart3 className="mx-auto mb-2 h-8 w-8 text-primary/50 md:mb-3 md:h-10 md:w-10" />
					<p className="font-sans text-muted-foreground text-xs md:text-sm">
						Visualização de dados em tempo real
					</p>
				</div>
			</motion.div>
		</MacbookScreenContent>
	);
}

export function DashboardPreview() {
	return (
		<section className="relative overflow-hidden py-16 md:py-24">
			{/* Background overlay */}
			<div className="absolute inset-0 bg-linear-to-b from-transparent via-background/50 to-background" />

			<motion.div
				className="container relative z-10 mx-auto px-4 md:px-6"
				initial="hidden"
				variants={staggerContainer}
				viewport={{ once: true, margin: '-100px' }}
				whileInView="visible"
			>
				<motion.div className="mb-8 md:mb-12" variants={fadeInUp}>
					<ScrollFloatText
						containerClassName="max-w-4xl mx-auto"
						subNoteClassName="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-4"
						textClassName="text-3xl md:text-4xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/50"
					/>
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
