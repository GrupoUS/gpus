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
		<footer className="relative border-border/50 border-t bg-background/80 backdrop-blur-xl">
			<motion.div
				className="container mx-auto px-4 py-12 md:px-6 md:py-16"
				initial="hidden"
				variants={staggerContainer}
				viewport={{ once: true, margin: '-50px' }}
				whileInView="visible"
			>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
					{/* Brand Column */}
					<motion.div className="space-y-4" variants={fadeInUp}>
						<Link className="group flex items-center space-x-2" to="/">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-us-gold transition-transform group-hover:scale-105">
								<span className="font-bold font-display text-primary-foreground text-sm">GU</span>
							</div>
							<span className="font-bold font-display text-xl tracking-tight">Grupo US</span>
						</Link>
						<p className="font-sans text-muted-foreground text-sm">
							Transformando profissionais da saúde estética através de educação, tecnologia e
							comunidade.
						</p>
						{/* Social Links */}
						<div className="flex items-center gap-4">
							{socialLinks.map((social) => (
								<a
									aria-label={social.label}
									className="text-muted-foreground transition-colors hover:text-primary"
									href={social.href}
									key={social.label}
								>
									<social.icon className="h-5 w-5" />
								</a>
							))}
						</div>
					</motion.div>

					{/* Produtos */}
					<motion.div className="space-y-4" variants={fadeInUp}>
						<h3 className="font-display font-semibold text-sm uppercase tracking-wider">
							Produtos
						</h3>
						<ul className="space-y-2">
							{footerLinks.produtos.map((link) => (
								<li key={link.label}>
									<a
										className="font-sans text-muted-foreground text-sm transition-colors hover:text-foreground"
										href={link.href}
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</motion.div>

					{/* Empresa */}
					<motion.div className="space-y-4" variants={fadeInUp}>
						<h3 className="font-display font-semibold text-sm uppercase tracking-wider">Empresa</h3>
						<ul className="space-y-2">
							{footerLinks.empresa.map((link) => (
								<li key={link.label}>
									<a
										className="font-sans text-muted-foreground text-sm transition-colors hover:text-foreground"
										href={link.href}
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</motion.div>

					{/* Suporte & Contato */}
					<motion.div className="space-y-4" variants={fadeInUp}>
						<h3 className="font-display font-semibold text-sm uppercase tracking-wider">Suporte</h3>
						<ul className="space-y-2">
							{footerLinks.suporte.map((link) => (
								<li key={link.label}>
									<a
										className="font-sans text-muted-foreground text-sm transition-colors hover:text-foreground"
										href={link.href}
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
						<div className="space-y-2 pt-4">
							{footerLinks.contato.map((link) => (
								<a
									className="flex items-center gap-2 font-sans text-muted-foreground text-sm transition-colors hover:text-foreground"
									href={link.href}
									key={link.label}
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
					className="mt-12 border-border/50 border-t pt-8 text-center"
					variants={fadeInUp}
				>
					<p className="font-sans text-muted-foreground text-sm">
						&copy; {new Date().getFullYear()} Grupo US. Todos os direitos reservados.
					</p>
					<p className="mt-2 font-sans text-muted-foreground text-xs">
						CNPJ: 00.000.000/0001-00 | São Paulo, SP - Brasil
					</p>
				</motion.div>
			</motion.div>
		</footer>
	);
}
