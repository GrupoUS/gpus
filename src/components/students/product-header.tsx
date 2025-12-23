'use client';

import {
	Activity,
	Briefcase,
	ChevronDown,
	ChevronUp,
	Package,
	Sparkles,
	Users,
	Utensils,
	Zap,
} from 'lucide-react';
import type { ElementType } from 'react';

import { Badge } from '@/components/ui/badge';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { productColors, productLabels } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ProductHeaderProps {
	productId: string;
	count: number;
	totalCount?: number;
	isExpanded: boolean;
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

export function ProductHeader({ productId, count, totalCount, isExpanded }: ProductHeaderProps) {
	const label = productLabels[productId] || 'Sem Produto';
	const colors = productColors[productId] || productColors.sem_produto;
	const Icon = productIcons[productId] || productIcons.sem_produto;

	return (
		<CollapsibleTrigger asChild>
			<button
				type="button"
				className={cn(
					'w-full flex items-center justify-between p-4 h-16 group transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					colors.bg,
				)}
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

				<div className="flex items-center gap-3">
					<div className="h-8 px-2 text-xs text-muted-foreground group-hover:text-foreground flex items-center border border-muted-foreground/20 rounded-md">
						{isExpanded ? (
							<>
								<ChevronUp className="h-3.5 w-3.5 mr-1" />
								Recolher
							</>
						) : (
							<>
								<ChevronDown className="h-3.5 w-3.5 mr-1" />
								Expandir
							</>
						)}
					</div>
				</div>
			</button>
		</CollapsibleTrigger>
	);
}
