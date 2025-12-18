'use client';

import { Link, useMatchRoute } from '@tanstack/react-router';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import type React from 'react';
import { createContext, useContext, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface Links {
	label: string;
	href: string;
	icon: React.JSX.Element | React.ReactNode;
	children?: Links[];
}

interface SidebarContextProps {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error('useSidebar must be used within a SidebarProvider');
	}
	return context;
};

export const SidebarProvider = ({
	children,
	open: openProp,
	setOpen: setOpenProp,
	animate = true,
}: {
	children: React.ReactNode;
	open?: boolean;
	setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
	animate?: boolean;
}) => {
	const [openState, setOpenState] = useState(false);

	const open = openProp !== undefined ? openProp : openState;
	const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

	return (
		<SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
			{children}
		</SidebarContext.Provider>
	);
};

export const Sidebar = ({
	children,
	open,
	setOpen,
	animate,
}: {
	children: React.ReactNode;
	open?: boolean;
	setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
	animate?: boolean;
}) => {
	return (
		<SidebarProvider open={open} setOpen={setOpen} animate={animate}>
			{children}
		</SidebarProvider>
	);
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
	return (
		<>
			<DesktopSidebar {...props} />
			<MobileSidebar {...(props as React.ComponentProps<'div'>)} />
		</>
	);
};

const SIDEBAR_WIDTH_COLLAPSED = '60px';
const SIDEBAR_WIDTH_EXPANDED = '250px';

export const DesktopSidebar = ({
	className,
	children,
	...props
}: React.ComponentProps<typeof motion.div>) => {
	const { open, setOpen, animate } = useSidebar();
	return (
		<motion.div
			className={cn(
				'h-full px-4 py-4 hidden md:flex md:flex-col bg-sidebar-background shrink-0',
				className,
			)}
			animate={{
				width: animate
					? open
						? SIDEBAR_WIDTH_EXPANDED
						: SIDEBAR_WIDTH_COLLAPSED
					: SIDEBAR_WIDTH_EXPANDED,
			}}
			onMouseEnter={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
			{...props}
		>
			{children}
		</motion.div>
	);
};

export const MobileSidebar = ({ className, children, ...props }: React.ComponentProps<'div'>) => {
	const { open, setOpen } = useSidebar();

	return (
		<div
			className={cn(
				'h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-sidebar-background w-full',
			)}
			{...props}
		>
			<div className="flex justify-end z-20 w-full">
				<Menu className="text-sidebar-foreground" onClick={() => setOpen(!open)} />
			</div>
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ x: '-100%', opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: '-100%', opacity: 0 }}
						transition={{
							duration: 0.3,
							ease: 'easeInOut',
						}}
						className={cn(
							'fixed h-full w-full inset-0 bg-background p-10 z-100 flex flex-col justify-between',
							className,
						)}
					>
						<button
							className="absolute right-10 top-10 z-50 text-foreground"
							onClick={() => setOpen(!open)}
							type="button"
							aria-label="Close sidebar"
						>
							<X />
						</button>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export const SidebarLink = ({ link, className, ...props }: { link: Links; className?: string }) => {
	const { open, animate } = useSidebar();
	const matchRoute = useMatchRoute();
	const isActive = matchRoute({ to: link.href, fuzzy: true });

	const mouseX = useMotionValue(Number.POSITIVE_INFINITY);
	const ref = useRef<HTMLDivElement>(null);

	const distance = useTransform(mouseX, (val) => {
		const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
		return val - bounds.x - bounds.width / 2;
	});

	const widthTransform = useTransform(distance, [-150, 0, 150], [0.8, 1.3, 0.8]);
	const scale = useSpring(widthTransform, {
		mass: 0.1,
		stiffness: 150,
		damping: 12,
	});

	return (
		<Link
			to={link.href}
			className={cn(
				'flex items-center justify-start gap-2 group/sidebar py-2.5',
				isActive && 'bg-sidebar-accent rounded-md px-2',
				className,
			)}
			onMouseMove={(e) => mouseX.set(e.pageX)}
			onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
			{...props}
		>
			<motion.div
				ref={ref}
				style={{ scale }}
				className="will-change-transform origin-center"
				transition={{ type: 'spring', stiffness: 150, damping: 12 }}
			>
				{link.icon}
			</motion.div>

			<motion.span
				animate={{
					display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
					opacity: animate ? (open ? 1 : 0) : 1,
				}}
				className="text-sidebar-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block p-0! m-0!"
			>
				{link.label}
			</motion.span>
		</Link>
	);
};
