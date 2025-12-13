import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export function Hero() {
	return (
		<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
			{/* Grid Pattern Background */}
			<div
				className="absolute inset-0 opacity-20"
				style={{
					backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
					backgroundSize: '50px 50px',
				}}
			/>

			{/* Gradient Overlay */}
			<div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />

			{/* Background Effects */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
				<motion.div
					className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
					animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
					transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
				/>
				<motion.div
					className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-us-gold/10 rounded-full blur-3xl"
					animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
					transition={{
						duration: 5,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
						delay: 1,
					}}
				/>
			</div>

			<motion.div
				variants={staggerContainer}
				initial="hidden"
				animate="visible"
				className="container px-4 md:px-6 mx-auto flex flex-col items-center text-center space-y-8 relative z-10"
			>
				{/* Badge with stars */}
				<motion.div
					variants={fadeInUp}
					className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-xl"
				>
					<div className="flex items-center gap-1">
						{[...Array(3)].map((_, i) => (
							<Star key={i} className="h-3 w-3 fill-us-gold text-us-gold" />
						))}
					</div>
					<span className="font-display">Nova Era de Gestão</span>
				</motion.div>

				{/* Main Title */}
				<motion.h1
					variants={fadeInUp}
					className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl"
				>
					<span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground">
						Potencialize sua Gestão com
					</span>
					<span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary via-us-purple-light to-primary">
						Inteligência Artificial
					</span>
				</motion.h1>

				{/* Subtitle */}
				<motion.p
					variants={fadeInUp}
					className="font-sans text-xl text-muted-foreground max-w-2xl mx-auto"
				>
					Uma plataforma completa para escalar suas vendas, gerenciar leads e automatizar processos.
					Tudo isso com a segurança e conformidade que você precisa.
				</motion.p>

				{/* CTAs */}
				<motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
					<Button
						asChild
						size="lg"
						className="rounded-full h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
					>
						<Link to="/sign-in">
							Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
					<Button
						asChild
						variant="outline"
						size="lg"
						className="rounded-full h-12 px-8 text-base backdrop-blur-sm bg-background/50 hover:bg-background/70"
					>
						<Link to="/sign-in">Agendar Demo</Link>
					</Button>
				</motion.div>
			</motion.div>
		</section>
	);
}
