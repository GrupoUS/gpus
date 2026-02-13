'use client';

import { type MotionValue, motion, useScroll, useSpring, useTransform } from 'motion/react';
import React from 'react';

export const HeroParallax = ({
	products,
	header,
}: {
	products: {
		title: string;
		link?: string;
		thumbnail?: string;
		content?: React.ReactNode;
	}[];
	header?: React.ReactNode;
}) => {
	const firstRow = products.slice(0, 5);
	const secondRow = products.slice(5, 10);
	const thirdRow = products.slice(10, 15);
	const ref = React.useRef(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ['start start', 'end start'],
	});

	const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

	const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), springConfig);
	const translateXReverse = useSpring(
		useTransform(scrollYProgress, [0, 1], [0, -1000]),
		springConfig,
	);
	const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), springConfig);
	const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig);
	const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), springConfig);
	const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 500]), springConfig);
	return (
		<div
			className="perspective-[1000px] transform-3d relative flex h-[300vh] flex-col self-auto overflow-hidden py-40 antialiased"
			ref={ref}
		>
			{header}
			<motion.div
				className=""
				style={{
					rotateX,
					rotateZ,
					translateY,
					opacity,
				}}
			>
				<motion.div className="mb-20 flex flex-row-reverse space-x-20 space-x-reverse">
					{firstRow.map((product) => (
						<ProductCard key={product.title} product={product} translate={translateX} />
					))}
				</motion.div>
				<motion.div className="mb-20 flex flex-row space-x-20">
					{secondRow.map((product) => (
						<ProductCard key={product.title} product={product} translate={translateXReverse} />
					))}
				</motion.div>
				<motion.div className="flex flex-row-reverse space-x-20 space-x-reverse">
					{thirdRow.map((product) => (
						<ProductCard key={product.title} product={product} translate={translateX} />
					))}
				</motion.div>
			</motion.div>
		</div>
	);
};

export const Header = () => {
	return (
		<div className="relative top-0 left-0 mx-auto w-full max-w-7xl px-4 py-20 md:py-40">
			<h1 className="font-bold text-2xl md:text-7xl dark:text-white">
				The Ultimate <br /> development studio
			</h1>
			<p className="mt-8 max-w-2xl text-base md:text-xl dark:text-neutral-200">
				We build beautiful products with the latest technologies and frameworks. We are a team of
				passionate developers and designers that love to build amazing products.
			</p>
		</div>
	);
};

export const ProductCard = ({
	product,
	translate,
}: {
	product: {
		title: string;
		link?: string;
		thumbnail?: string;
		content?: React.ReactNode;
	};
	translate: MotionValue<number>;
}) => {
	return (
		<motion.div
			className="group/product relative h-96 w-120 shrink-0"
			key={product.title}
			style={{
				x: translate,
			}}
			whileHover={{
				y: -20,
			}}
		>
			{product.link ? (
				<a className="block h-full w-full group-hover/product:shadow-2xl" href={product.link}>
					{product.content ? (
						product.content
					) : (
						<img
							alt={product.title}
							className="absolute inset-0 h-full w-full object-cover object-top-left"
							height="600"
							src={product.thumbnail}
							width="600"
						/>
					)}
				</a>
			) : (
				<div className="block h-full w-full group-hover/product:shadow-2xl">
					{product.content ? (
						product.content
					) : (
						<img
							alt={product.title}
							className="absolute inset-0 h-full w-full object-cover object-top-left"
							height="600"
							src={product.thumbnail}
							width="600"
						/>
					)}
				</div>
			)}

			{!product.content && (
				<>
					<div className="pointer-events-none absolute inset-0 h-full w-full bg-black opacity-0 group-hover/product:opacity-80" />
					<h2 className="absolute bottom-4 left-4 text-white opacity-0 group-hover/product:opacity-100">
						{product.title}
					</h2>
				</>
			)}
		</motion.div>
	);
};
