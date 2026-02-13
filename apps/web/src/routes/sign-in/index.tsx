'use client';

import { SignIn } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';

import { fadeInUp } from '@/lib/animations';

// biome-ignore lint/suspicious/noExplicitAny: TanStack Router wildcard route
export const Route = createFileRoute('/sign-in/' as any)({
	component: SignInPage,
});

function SignInPage() {
	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mesh bg-noise">
			{/* Background effects */}
			<div className="pointer-events-none absolute inset-0">
				<motion.div
					animate={{
						scale: [1, 1.2, 1],
						opacity: [0.3, 0.5, 0.3],
					}}
					className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
					transition={{
						duration: 8,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
					}}
				/>
				<motion.div
					animate={{
						scale: [1.2, 1, 1.2],
						opacity: [0.2, 0.4, 0.2],
					}}
					className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-us-gold/10 blur-3xl"
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
				animate="visible"
				className="relative z-10 w-full max-w-md px-4"
				initial="hidden"
				variants={fadeInUp}
			>
				<div className="glass-card rounded-2xl p-8 shadow-2xl">
					<SignIn
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
						forceRedirectUrl="/dashboard"
						path="/sign-in"
						routing="path"
						signUpUrl="/sign-up"
					/>
				</div>
			</motion.div>
		</div>
	);
}
