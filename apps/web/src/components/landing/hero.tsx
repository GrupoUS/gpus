import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

import { fadeInUp, staggerContainer } from '@/lib/animations';

export function Hero() {
	return (
		<section className="relative flex min-h-screen items-center justify-center overflow-hidden">
			{/* Grid Pattern Background */}
			<div
				className="absolute inset-0 opacity-20"
				style={{
					backgroundImage:
						'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
					backgroundSize: '50px 50px',
				}}
			/>

			{/* Gradient Overlay */}
			<div className="absolute top-0 left-0 -z-10 h-[500px] w-full bg-linear-to-b from-primary/5 to-transparent" />

			{/* Background Effects */}
			<div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-full w-full max-w-7xl -translate-x-1/2">
				<motion.div
					animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
					className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
					transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
				/>
				<motion.div
					animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
					className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-us-gold/10 blur-3xl"
					transition={{
						duration: 5,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
						delay: 1,
					}}
				/>
			</div>

			<motion.div
				animate="visible"
				className="container relative z-10 mx-auto flex flex-col items-center space-y-8 px-4 text-center md:px-6"
				initial="hidden"
				variants={staggerContainer}
			>
				{/* Badge with stars */}
				<motion.div
					className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 font-medium text-primary text-sm backdrop-blur-xl"
					variants={fadeInUp}
				>
					<div className="flex items-center gap-1">
						{[...new Array(3)].map((_, i) => (
							<Star className="h-3 w-3 fill-us-gold text-us-gold" key={i} />
						))}
					</div>
					<span className="font-display">Nova Era de Gestão</span>
				</motion.div>

				{/* Main Title */}
				<motion.h1
					className="max-w-4xl font-bold font-display text-4xl tracking-tight md:text-6xl lg:text-7xl"
					variants={fadeInUp}
				>
					<span className="bg-linear-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
						Potencialize sua Gestão com
					</span>
					<span className="block bg-linear-to-r from-primary via-us-purple-light to-primary bg-clip-text text-transparent">
						Inteligência Artificial
					</span>
				</motion.h1>

				{/* Subtitle */}
				<motion.p
					className="mx-auto max-w-2xl font-sans text-muted-foreground text-xl"
					variants={fadeInUp}
				>
					A plataforma que escala suas vendas, gerencia o controle de leads e automatiza seus
					processos, em um só lugar!
				</motion.p>
			</motion.div>
		</section>
	);
}
