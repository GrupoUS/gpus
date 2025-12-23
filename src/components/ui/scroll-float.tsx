import { type MotionValue, motion, useScroll, useTransform } from 'framer-motion';
import { useMemo, useRef } from 'react';

type ScrollFloatProps = {
	children: string;
	containerClassName?: string;
	textClassName?: string;
	animationDuration?: number;
	ease?: string;
	scrollStart?: string;
	scrollEnd?: string;
	stagger?: number;
};

export const ScrollFloat = ({
	children,
	containerClassName = '',
	textClassName = '',
	animationDuration = 0.3,
	ease: _ease = 'back.out(2)', // unused in this implementation but kept for API stability
	scrollStart = 'start end',
	scrollEnd = 'end start',
	stagger = 0.02,
}: ScrollFloatProps) => {
	const containerRef = useRef<HTMLDivElement>(null);

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: [scrollStart as 'start end', scrollEnd as 'end start'],
	});

	const words = useMemo(() => {
		return children.split(' ');
	}, [children]);

	return (
		<div ref={containerRef} className={`flex flex-wrap justify-center ${containerClassName}`}>
			{words.map((word, i) => (
				<Word
					key={i}
					word={word}
					index={i}
					progress={scrollYProgress}
					textClassName={textClassName}
					stagger={stagger}
					duration={animationDuration}
				/>
			))}
		</div>
	);
};

const Word = ({
	word,
	index,
	progress,
	textClassName,
	stagger,
	duration,
}: {
	word: string;
	index: number;
	progress: MotionValue<number>;
	textClassName: string;
	stagger: number;
	duration: number;
}) => {
	const start = index * stagger;
	const safeStart = Math.min(start, 1 - duration);
	const end = safeStart + duration;

	const opacity = useTransform(progress, [safeStart, end], [0, 1]);
	const y = useTransform(progress, [safeStart, end], [50, 0]);
	const rotateX = useTransform(progress, [safeStart, end], [45, 0]);

	return (
		<span className="relative mr-2 mb-2 inline-block">
			<motion.span style={{ opacity, y, rotateX }} className={`inline-block ${textClassName}`}>
				{word}
			</motion.span>
		</span>
	);
};
