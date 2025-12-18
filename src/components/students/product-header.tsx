'use client';

import {
	Activity,
	Briefcase,
	ChevronDown,
	Package,
	Sparkles,
	Users,
	Utensils,
	Zap,
} from 'lucide-react';
import type { ElementType } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { productColors, productLabels } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ProductHeaderProps {
	productId: string;
	count: number;
	totalCount?: number;
	isExpanded: boolean;
	onToggle: () => void;
}

const productIcons: Record<string, ElementType> = {
	trintae3: Zap,
	otb: Briefcase,
	black_neon: Sparkles,
	comunidade: Users,
	auriculo: Activity,
	na_mesa_certa: Utensils,
	sem_produto: Package,
};

export function ProductHeader({
	productId,
	count,
	totalCount,
	isExpanded,
	onToggle,
}: ProductHeaderProps) {
	const label = productLabels[productId] || 'Sem Produto';
	const colors = productColors[productId] || productColors.sem_produto;
	const Icon = productIcons[productId] || productIcons.sem_produto;

	return (
		<CollapsibleTrigger asChild>
			<Button
				variant="ghost"
				className={cn(
					'w-full flex items-center justify-between p-4 h-16 group transition-colors duration-200',
					colors.bg,
				)}
				onClick={onToggle}
				aria-label={`${isExpanded ? 'Recolher' : 'Expandir'} seção de ${label}`}
				aria-expanded={isExpanded}
			>
				<div className="flex items-center gap-3">
					<div
						className={cn(
							'w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105',
							colors.color,
						)}
					>
						<Icon className="w-5 h-5" />
					</div>
					<div className="flex flex-col items-start gap-0.5">
						<h2 className="text-lg font-semibold tracking-tight text-foreground">{label}</h2>
						<Badge variant="secondary" className="text-xs font-normal h-5 px-1.5">
							{totalCount ? `${count} de ${totalCount} alunos` : `${count} alunos`}
						</Badge>
					</div>
				</div>

				<ChevronDown
					className={cn(
						'h-5 w-5 text-muted-foreground transition-transform duration-200',
						isExpanded && 'rotate-180',
					)}
				/>
			</Button>
		</CollapsibleTrigger>
	);
}
