import { Link } from '@tanstack/react-router';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { scrollY } = useScroll();
	const backgroundOpacity = useTransform(scrollY, [0, 100], [0, 0.8]);
	const paddingY = useTransform(scrollY, [0, 100], [24, 12]);
	const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.5]);

	const backgroundColor = useTransform(
		backgroundOpacity,
		(opacity) => `hsl(var(--background) / ${opacity})`,
	);
	const backdropBlur = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(24px)']);
	const borderColor = useTransform(borderOpacity, (opacity) => `hsl(var(--border) / ${opacity})`);

	return (
		<motion.nav
			style={{
				backgroundColor,
				backdropFilter: backdropBlur,
				paddingTop: paddingY,
				paddingBottom: paddingY,
				borderBottomColor: borderColor,
			}}
			className={cn('fixed top-0 left-0 right-0 z-50 px-6 border-b border-transparent')}
		>
			<div className="container mx-auto flex items-center justify-between">
				{/* Logo */}
				<Link to="/" className="flex items-center space-x-2 group">
					<div className="w-8 h-8 bg-linear-gradient-to-br from-primary to-us-gold rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
						<span className="text-primary-foreground font-bold text-sm font-display">GU</span>
					</div>
					<span className="font-display font-bold text-xl tracking-tight text-gradient group-hover:text-primary transition-colors">
						Grupo US
					</span>
				</Link>

				{/* Desktop Navigation */}
				<div className="hidden md:flex items-center space-x-8">
					{['O UNIVERSO', 'SOLUÇÕES', 'DEPOIMENTOS'].map((item) => (
						<button
							key={item}
							type="button"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors tracking-wide"
						>
							{item}
						</button>
					))}
					<Link
						to="/sign-in"
						className="text-sm font-medium text-primary hover:text-primary/80 transition-colors tracking-wide"
					>
						Entrar
					</Link>
				</div>

				{/* Desktop CTA */}
				<div className="hidden md:flex items-center space-x-4">
					<Button asChild variant="ghost" size="sm">
						<Link to="/sign-in">LOGIN</Link>
					</Button>
					<Button
						asChild
						size="sm"
						className="bg-us-gold hover:bg-us-gold/90 text-black font-medium"
					>
						<Link to="/sign-in">Começar Agora</Link>
					</Button>
				</div>

				{/* Mobile Menu Button */}
				<Button
					variant="ghost"
					size="sm"
					className="md:hidden"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
					aria-expanded={mobileMenuOpen}
				>
					{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
				</Button>
			</div>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border md:hidden">
					<div className="container mx-auto px-6 py-4 space-y-4">
						{['O UNIVERSO', 'SOLUÇÕES', 'DEPOIMENTOS'].map((item) => (
							<button
								key={item}
								type="button"
								className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 w-full text-left"
								onClick={() => setMobileMenuOpen(false)}
							>
								{item}
							</button>
						))}
						<Link
							to="/sign-in"
							onClick={() => setMobileMenuOpen(false)}
							className="block text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2"
						>
							Entrar
						</Link>
						<div className="flex flex-col space-y-2 pt-4 border-t border-border/50">
							<Button asChild variant="ghost" size="sm" className="justify-start">
								<Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
									LOGIN
								</Link>
							</Button>
							<Button
								asChild
								size="sm"
								className="bg-us-gold hover:bg-us-gold/90 text-black font-medium justify-start"
								onClick={() => setMobileMenuOpen(false)}
							>
								<Link to="/sign-in">Começar Agora</Link>
							</Button>
						</div>
					</div>
				</div>
			)}
		</motion.nav>
	);
}
