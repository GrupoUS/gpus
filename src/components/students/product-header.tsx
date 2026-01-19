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
				aria-expanded={isExpanded}
				aria-label={`${isExpanded ? 'Recolher' : 'Expandir'} seção de ${label}`}
				className={cn(
					'group flex h-16 w-full cursor-pointer items-center justify-between p-4 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					colors.bg,
				)}
				type="button"
			>
				<div className="flex items-center gap-3">
					<div
						className={cn(
							'flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm transition-transform group-hover:scale-105',
							colors.color,
						)}
					>
						<Icon className="h-5 w-5" />
					</div>
					<div className="flex flex-col items-start gap-0.5">
						<h2 className="font-semibold text-foreground text-lg tracking-tight">{label}</h2>
						<Badge className="h-5 px-1.5 font-normal text-xs" variant="secondary">
							{totalCount ? `${count} de ${totalCount} alunos` : `${count} alunos`}
						</Badge>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<div className="flex h-8 items-center rounded-md border border-muted-foreground/20 px-2 text-muted-foreground text-xs group-hover:text-foreground">
						{isExpanded ? (
							<>
								<ChevronUp className="mr-1 h-3.5 w-3.5" />
								Recolher
							</>
						) : (
							<>
								<ChevronDown className="mr-1 h-3.5 w-3.5" />
								Expandir
							</>
						)}
					</div>
				</div>
			</button>
		</CollapsibleTrigger>
	);
}
