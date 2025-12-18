'use client';

import { type HTMLMotionProps, motion } from 'framer-motion';
import React, { createContext, useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

const FlipButtonContext = createContext({
	isFlipped: false,
});

interface FlipButtonProps extends HTMLMotionProps<'button'> {
	children: React.ReactNode;
}

export const FlipButton = React.forwardRef<HTMLButtonElement, FlipButtonProps>(
	({ children, className, ...props }, ref) => {
		const [isFlipped, setFlipped] = useState(false);

		const handleInteraction = useCallback((val: boolean) => {
			setFlipped(val);
		}, []);

		return (
			<FlipButtonContext.Provider value={{ isFlipped }}>
				<motion.button
					className={cn(
						'group relative w-32 cursor-pointer border-none bg-transparent p-0',
						'preserve-3d perspective-1000',
						className,
					)}
					initial="initial"
					whileHover="flipped"
					whileTap="flipped"
					onHoverStart={() => handleInteraction(true)}
					onHoverEnd={() => handleInteraction(false)}
					onFocus={() => handleInteraction(true)}
					onBlur={() => handleInteraction(false)}
					ref={ref}
					{...props}
				>
					<div className="relative h-full w-full preserve-3d transition-transform duration-500">
						<motion.div
							className="absolute inset-0 h-full w-full backface-hidden"
							transition={{
								type: 'spring',
								stiffness: 260,
								damping: 20,
							}}
							variants={{
								initial: { rotateX: 0, opacity: 1 },
								flipped: { rotateX: 180, opacity: 0 },
							}}
						>
							{React.Children.map(children, (child) => {
								if (React.isValidElement(child) && child.type === FlipButtonFront) {
									return child;
								}
								return null;
							})}
						</motion.div>

						<motion.div
							className="absolute inset-0 h-full w-full backface-hidden"
							style={{ rotateX: 180 }}
							transition={{
								type: 'spring',
								stiffness: 260,
								damping: 20,
							}}
							variants={{
								initial: { rotateX: 180, opacity: 0 },
								flipped: { rotateX: 0, opacity: 1 },
							}}
						>
							{React.Children.map(children, (child) => {
								if (React.isValidElement(child) && child.type === FlipButtonBack) {
									return child;
								}
								return null;
							})}
						</motion.div>
					</div>
				</motion.button>
			</FlipButtonContext.Provider>
		);
	},
);

FlipButton.displayName = 'FlipButton';

interface FlipButtonFrontProps extends HTMLMotionProps<'div'> {
	children: React.ReactNode;
}

export const FlipButtonFront = ({ children, className, ...props }: FlipButtonFrontProps) => {
	return (
		<motion.div
			className={cn(
				'flex h-full w-full items-center justify-center rounded-md bg-white text-black backface-hidden',
				className,
			)}
			{...props}
		>
			{children}
		</motion.div>
	);
};

interface FlipButtonBackProps extends HTMLMotionProps<'div'> {
	children: React.ReactNode;
}

export const FlipButtonBack = ({ children, className, ...props }: FlipButtonBackProps) => {
	return (
		<motion.div
			className={cn(
				'flex h-full w-full items-center justify-center rounded-md bg-black text-white backface-hidden',
				className,
			)}
			{...props}
		>
			{children}
		</motion.div>
	);
};
