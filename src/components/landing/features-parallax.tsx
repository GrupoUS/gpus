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
			<Card className="glass-card group flex h-full flex-col justify-center border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10 hover:shadow-xl">
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
		),
	}));

	// Replicate the list to fill the rows (HeroParallax expects ~15 items for full effect)
	// We have 6 features, so we can duplicate them to fill 15 slots (3 rows of 5)
	// Or we can just let it have fewer items, but it might look empty.
	// Let's triple the array to get 18 items, enough for 3 rows.
	const displayProducts = [...products, ...products, ...products].slice(0, 15);

	const Header = () => (
		<div className="relative top-0 left-0 mx-auto w-full max-w-7xl px-4 py-20 md:py-40">
			<motion.div className="max-w-3xl" initial="hidden" variants={fadeInUp} whileInView="visible">
				<h2 className="mb-4 font-bold font-display text-3xl text-foreground tracking-tight md:text-5xl">
					Tudo que você precisa para crescer
				</h2>
				<p className="font-sans text-lg text-muted-foreground md:text-xl">
					Ferramentas poderosas desenhadas para impulsionar seu negócio para o próximo nível.
				</p>
			</motion.div>
		</div>
	);

	return <HeroParallax header={<Header />} products={displayProducts} />;
}
