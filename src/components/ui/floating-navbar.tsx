import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';

import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { RippleButton } from '@/components/ui/ripple-button';
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
				animate={{
					y: visible ? 0 : -100,
					opacity: visible ? 1 : 0,
				}}
				className={cn(
					'fixed inset-x-0 top-10 z-5000 mx-auto flex max-w-fit items-center justify-center rounded-full',
					className,
				)}
				initial={{
					opacity: 1,
					y: -100,
				}}
				transition={{
					duration: 0.2,
				}}
			>
				<Link to="/sign-in">
					<HoverBorderGradient
						as="div"
						className="flex items-center space-x-2 bg-background text-foreground"
						containerClassName="rounded-full"
					>
						<RippleButton
							className="bg-transparent px-8 py-2 font-bold text-amber-400 text-lg transition-transform hover:scale-105 hover:bg-transparent"
							rippleColor="rgba(217, 119, 6, 0.2)"
						>
							Login
						</RippleButton>
					</HoverBorderGradient>
				</Link>
			</motion.nav>
		</AnimatePresence>
	);
};
