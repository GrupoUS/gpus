'use client';

import { SignIn } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';

import { fadeInUp } from '@/lib/animations';

// biome-ignore lint/suspicious/noExplicitAny: TanStack Router wildcard route
export const Route = createFileRoute('/sign-in/$' as any)({
	component: SignInPage,
});

function SignInPage() {
	return (
		<div className="flex items-center justify-center min-h-screen bg-mesh bg-noise relative overflow-hidden">
			{/* Background effects */}
			<div className="absolute inset-0 pointer-events-none">
				<motion.div
					className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
					animate={{
						scale: [1, 1.2, 1],
						opacity: [0.3, 0.5, 0.3],
					}}
					transition={{
						duration: 8,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
					}}
				/>
				<motion.div
					className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-us-gold/10 rounded-full blur-3xl"
					animate={{
						scale: [1.2, 1, 1.2],
						opacity: [0.2, 0.4, 0.2],
					}}
					transition={{
						duration: 10,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
						delay: 1,
					}}
				/>
			</div>

			{/* Content */}
			<motion.div
				variants={fadeInUp}
				initial="hidden"
				animate="visible"
				className="relative z-10 w-full max-w-md px-4"
			>
				<div className="glass-card rounded-2xl p-8 shadow-2xl">
					<SignIn
						routing="path"
						path="/sign-in"
						signUpUrl="/sign-up"
						forceRedirectUrl="/dashboard"
						appearance={{
							elements: {
								rootBox: 'mx-auto',
								card: 'bg-transparent shadow-none',
								headerTitle: 'font-display text-2xl font-bold',
								headerSubtitle: 'font-sans text-muted-foreground',
								socialButtonsBlockButton: 'bg-background/50 border-border hover:bg-background/70',
								formButtonPrimary:
									'bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg',
								formFieldInput:
									'bg-background/50 border-border focus:border-primary focus:ring-primary',
								footerActionLink: 'text-primary hover:text-primary/80',
							},
						}}
					/>
				</div>
			</motion.div>
		</div>
	);
}
