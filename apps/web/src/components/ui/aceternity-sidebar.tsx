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
		<SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>
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
		<SidebarProvider animate={animate} open={open} setOpen={setOpen}>
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
	let sidebarWidth = SIDEBAR_WIDTH_EXPANDED;
	if (animate) {
		sidebarWidth = open ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;
	}
	return (
		<motion.div
			animate={{
				width: sidebarWidth,
			}}
			className={cn(
				'hidden h-full shrink-0 bg-sidebar-background px-4 py-4 md:flex md:flex-col',
				className,
			)}
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
				'flex h-10 w-full flex-row items-center justify-between bg-sidebar-background px-4 py-4 md:hidden',
			)}
			{...props}
		>
			<div className="z-20 flex w-full justify-end">
				<Menu className="text-sidebar-foreground" onClick={() => setOpen(!open)} />
			</div>
			<AnimatePresence>
				{open && (
					<motion.div
						animate={{ x: 0, opacity: 1 }}
						className={cn(
							'fixed inset-0 z-100 flex h-full w-full flex-col justify-between bg-background p-10',
							className,
						)}
						exit={{ x: '-100%', opacity: 0 }}
						initial={{ x: '-100%', opacity: 0 }}
						transition={{
							duration: 0.3,
							ease: 'easeInOut',
						}}
					>
						<button
							aria-label="Close sidebar"
							className="absolute top-10 right-10 z-50 text-foreground"
							onClick={() => setOpen(!open)}
							type="button"
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

	let labelDisplay: 'inline-block' | 'none' = 'inline-block';
	let labelOpacity = 1;
	if (animate) {
		labelDisplay = open ? 'inline-block' : 'none';
		labelOpacity = open ? 1 : 0;
	}

	return (
		<Link
			className={cn(
				'group/sidebar flex items-center justify-start gap-2 py-2.5',
				isActive && 'rounded-md bg-sidebar-accent px-2',
				className,
			)}
			onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
			onMouseMove={(e) => mouseX.set(e.pageX)}
			to={link.href}
			{...props}
		>
			<motion.div
				className="origin-center will-change-transform"
				ref={ref}
				style={{ scale }}
				transition={{ type: 'spring', stiffness: 150, damping: 12 }}
			>
				{link.icon}
			</motion.div>

			<motion.span
				animate={{
					display: labelDisplay,
					opacity: labelOpacity,
				}}
				className="m-0! inline-block whitespace-pre p-0! text-sidebar-foreground text-sm transition duration-150 group-hover/sidebar:translate-x-1"
			>
				{link.label}
			</motion.span>
		</Link>
	);
};
