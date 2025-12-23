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
					'flex max-w-fit fixed top-10 inset-x-0 mx-auto rounded-full z-5000 items-center justify-center',
					className,
				)}
			>
				<Link to="/sign-in">
					<HoverBorderGradient
						containerClassName="rounded-full"
						as="div"
						className="bg-background text-foreground flex items-center space-x-2"
					>
						<RippleButton
							className="bg-transparent hover:bg-transparent text-amber-400 font-bold px-8 py-2 text-lg hover:scale-105 transition-transform"
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
