'use client';

import { motion } from 'motion/react';

import { features } from '@/components/landing/features';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroParallax } from '@/components/ui/hero-parallax';
import { fadeInUp } from '@/lib/animations';

export function FeaturesParallax() {
	const products = features.map((feature) => ({
		title: feature.title,
		link: undefined,
		thumbnail: undefined,
		content: (
			<Card className="glass-card border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group h-full flex flex-col justify-center">
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
		),
	}));

	// Replicate the list to fill the rows (HeroParallax expects ~15 items for full effect)
	// We have 6 features, so we can duplicate them to fill 15 slots (3 rows of 5)
	// Or we can just let it have fewer items, but it might look empty.
	// Let's triple the array to get 18 items, enough for 3 rows.
	const displayProducts = [...products, ...products, ...products].slice(0, 15);

	const Header = () => (
		<div className="max-w-7xl relative mx-auto py-20 md:py-40 px-4 w-full left-0 top-0">
			<motion.div variants={fadeInUp} initial="hidden" whileInView="visible" className="max-w-3xl">
				<h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
					Tudo que você precisa para crescer
				</h2>
				<p className="font-sans text-muted-foreground text-lg md:text-xl">
					Ferramentas poderosas desenhadas para impulsionar seu negócio para o próximo nível.
				</p>
			</motion.div>
		</div>
	);

	return <HeroParallax products={displayProducts} header={<Header />} />;
}
