'use client';

import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin, Mail, Phone } from 'lucide-react';

import { fadeInUp, staggerContainer } from '@/lib/animations';

const footerLinks = {
	produtos: [
		{ label: 'TRINTAE3', href: '#' },
		{ label: 'Black NEON', href: '#' },
		{ label: 'Comunidade US', href: '#' },
		{ label: 'OTB MBA', href: '#' },
		{ label: 'Aurículo', href: '#' },
	],
	empresa: [
		{ label: 'Sobre Nós', href: '#' },
		{ label: 'Depoimentos', href: '#' },
		{ label: 'Blog', href: '#' },
		{ label: 'Carreiras', href: '#' },
	],
	suporte: [
		{ label: 'Central de Ajuda', href: '#' },
		{ label: 'Contato', href: '#' },
		{ label: 'Política de Privacidade', href: '#' },
		{ label: 'Termos de Uso', href: '#' },
	],
	contato: [
		{ label: 'contato@grupous.com.br', href: 'mailto:contato@grupous.com.br', icon: Mail },
		{ label: '(11) 99999-9999', href: 'tel:+5511999999999', icon: Phone },
	],
};

const socialLinks = [
	{ label: 'Instagram', href: '#', icon: Instagram },
	{ label: 'Facebook', href: '#', icon: Facebook },
	{ label: 'LinkedIn', href: '#', icon: Linkedin },
];

export function Footer() {
	return (
		<footer className="relative border-t border-border/50 bg-background/80 backdrop-blur-xl">
			<motion.div
				variants={staggerContainer}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: '-50px' }}
				className="container px-4 md:px-6 mx-auto py-12 md:py-16"
			>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
					{/* Brand Column */}
					<motion.div variants={fadeInUp} className="space-y-4">
						<Link to="/" className="flex items-center space-x-2 group">
							<div className="w-8 h-8 bg-gradient-to-br from-primary to-us-gold rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
								<span className="text-primary-foreground font-bold text-sm font-display">GU</span>
							</div>
							<span className="font-display font-bold text-xl tracking-tight">Grupo US</span>
						</Link>
						<p className="font-sans text-sm text-muted-foreground">
							Transformando profissionais da saúde estética através de educação, tecnologia e
							comunidade.
						</p>
						{/* Social Links */}
						<div className="flex items-center gap-4">
							{socialLinks.map((social) => (
								<a
									key={social.label}
									href={social.href}
									aria-label={social.label}
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									<social.icon className="h-5 w-5" />
								</a>
							))}
						</div>
					</motion.div>

					{/* Produtos */}
					<motion.div variants={fadeInUp} className="space-y-4">
						<h3 className="font-display font-semibold text-sm uppercase tracking-wider">
							Produtos
						</h3>
						<ul className="space-y-2">
							{footerLinks.produtos.map((link) => (
								<li key={link.label}>
									<a
										href={link.href}
										className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</motion.div>

					{/* Empresa */}
					<motion.div variants={fadeInUp} className="space-y-4">
						<h3 className="font-display font-semibold text-sm uppercase tracking-wider">
							Empresa
						</h3>
						<ul className="space-y-2">
							{footerLinks.empresa.map((link) => (
								<li key={link.label}>
									<a
										href={link.href}
										className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</motion.div>

					{/* Suporte & Contato */}
					<motion.div variants={fadeInUp} className="space-y-4">
						<h3 className="font-display font-semibold text-sm uppercase tracking-wider">
							Suporte
						</h3>
						<ul className="space-y-2">
							{footerLinks.suporte.map((link) => (
								<li key={link.label}>
									<a
										href={link.href}
										className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
						<div className="pt-4 space-y-2">
							{footerLinks.contato.map((link) => (
								<a
									key={link.label}
									href={link.href}
									className="flex items-center gap-2 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.icon && <link.icon className="h-4 w-4" />}
									{link.label}
								</a>
							))}
						</div>
					</motion.div>
				</div>

				{/* Copyright */}
				<motion.div
					variants={fadeInUp}
					className="mt-12 pt-8 border-t border-border/50 text-center"
				>
					<p className="font-sans text-sm text-muted-foreground">
						&copy; {new Date().getFullYear()} Grupo US. Todos os direitos reservados.
					</p>
					<p className="font-sans text-xs text-muted-foreground mt-2">
						CNPJ: 00.000.000/0001-00 | São Paulo, SP - Brasil
					</p>
				</motion.div>
			</motion.div>
		</footer>
	);
}
