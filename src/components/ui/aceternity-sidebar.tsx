'use client';

import { Link, useMatchRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import type React from 'react';
import { createContext, useContext, useState } from 'react';

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
				'h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 shrink-0',
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
				'h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full',
			)}
			{...props}
		>
			<div className="flex justify-end z-20 w-full">
				<Menu className="text-neutral-800 dark:text-neutral-200" onClick={() => setOpen(!open)} />
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
							'fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-100 flex flex-col justify-between',
							className,
						)}
					>
						<button
							className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
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

	return (
		<Link
			to={link.href}
			className={cn(
				'flex items-center justify-start gap-2 group/sidebar py-2.5',
				isActive && 'bg-neutral-200/50 dark:bg-neutral-700/50 rounded-md px-2',
				className,
			)}
			{...props}
		>
			{link.icon}

			<motion.span
				animate={{
					display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
					opacity: animate ? (open ? 1 : 0) : 1,
				}}
				className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block p-0! m-0!"
			>
				{link.label}
			</motion.span>
		</Link>
	);
};

export const SidebarLinkWithSubmenu = ({
	link,
	className,
	...props
}: {
	link: Links;
	className?: string;
}) => {
	const { open, animate } = useSidebar();
	const matchRoute = useMatchRoute();

	// Check if any child route is active
	const isChildActive = link.children?.some((child) => matchRoute({ to: child.href, fuzzy: true }));

	// Check if parent route is active
	const isParentActive = matchRoute({ to: link.href, fuzzy: true });
	const isActive = isParentActive || isChildActive;

	// Initialize isExpanded based on active state
	const [isExpanded, setIsExpanded] = useState(isActive);

	// Auto-expand submenu when a child or parent route becomes active
	useEffect(() => {
		if (isActive) {
			setIsExpanded(true);
		}
	}, [isActive]);

	return (
		<div className="flex flex-col">
			{/* Parent Row - Split into Link and Toggle */}
			<div
				className={cn(
					'flex items-center justify-between gap-2 group/sidebar py-2.5 w-full',
					isActive && 'bg-neutral-200/50 dark:bg-neutral-700/50 rounded-md',
					className,
				)}
				{...props}
			>
				{/* Navigable Link - clicking this navigates to parent href */}
				<Link to={link.href} className="flex items-center gap-2 flex-1 min-w-0">
					{link.icon}
					<motion.span
						animate={{
							display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
							opacity: animate ? (open ? 1 : 0) : 1,
						}}
						className="text-neutral-700 dark:text-neutral-200 text-sm whitespace-pre group-hover/sidebar:translate-x-1 transition duration-150"
					>
						{link.label}
					</motion.span>
				</Link>

				{/* Chevron Toggle - clicking this toggles submenu */}
				{link.children && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setIsExpanded(!isExpanded);
						}}
						className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
						aria-label={isExpanded ? 'Collapse submenu' : 'Expand submenu'}
					>
						<motion.div
							animate={{
								display: animate ? (open ? 'block' : 'none') : 'block',
								opacity: animate ? (open ? 1 : 0) : 1,
								rotate: isExpanded ? 180 : 0,
							}}
						>
							<ChevronDown className="h-4 w-4 text-neutral-500" />
						</motion.div>
					</button>
				)}
			</div>

			{/* Submenu */}
			{link.children && isExpanded && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{
						height: open ? 'auto' : 0,
						opacity: open ? 1 : 0,
					}}
					exit={{ height: 0, opacity: 0 }}
					className="ml-6 mt-1 space-y-1 overflow-hidden"
				>
					{link.children.map((child, idx) => (
						<SidebarLink key={idx} link={child} className="py-1.5" />
					))}
				</motion.div>
			)}
		</div>
	);
};
