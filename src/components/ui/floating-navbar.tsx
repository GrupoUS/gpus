import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const FloatingNavbar = ({ className }: { className?: string }) => {
	const { scrollYProgress } = useScroll();
	const [visible, setVisible] = useState(true);

	useMotionValueEvent(scrollYProgress, 'change', (current) => {
		// Check if current is not undefined and is a number
		if (typeof current === 'number') {
			const previous = scrollYProgress.getPrevious();
			const direction = previous !== undefined ? current - previous : 0;

			if (scrollYProgress.get() < 0.05) {
				setVisible(true);
			} else if (direction < 0) {
				setVisible(true);
			} else {
				setVisible(false);
			}
		}
	});

	return (
		<AnimatePresence mode="wait">
			<motion.nav
				initial={{
					opacity: 1,
					y: -100,
				}}
				animate={{
					y: visible ? 0 : -100,
					opacity: visible ? 1 : 0,
				}}
				transition={{
					duration: 0.2,
				}}
				className={cn(
					'flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-primary/20 rounded-full bg-background/80 backdrop-blur-md shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-5000 pr-2 pl-4 py-2  items-center justify-between space-x-14',
					className,
				)}
			>
				<Link to="/" className="flex items-center space-x-2 h-10">
					<img src="/grupo-us-logo.png" alt="Grupo US Logo" className="h-8 w-auto object-contain" />
				</Link>

				<div className="flex items-center space-x-4">
					<Button
						asChild
						size="sm"
						className="rounded-full bg-black dark:bg-white text-white dark:text-black px-6 hover:bg-black/90 dark:hover:bg-white/90"
					>
						<Link to="/sign-in">Login</Link>
					</Button>
				</div>
			</motion.nav>
		</AnimatePresence>
	);
};
