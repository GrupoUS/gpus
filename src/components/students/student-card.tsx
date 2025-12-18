'use client';

import type { Doc } from '@convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Building2, GraduationCap, Mail, Phone, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StudentCardProps {
	student: Doc<'students'>;
	onClick?: () => void;
	searchTerm?: string;
}

const statusLabels: Record<string, string> = {
	ativo: 'Ativo',
	inativo: 'Inativo',
	pausado: 'Pausado',
	formado: 'Formado',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
	ativo: 'default',
	inativo: 'secondary',
	pausado: 'outline',
	formado: 'default',
};

const churnRiskColors: Record<string, string> = {
	baixo: 'text-green-500',
	medio: 'text-yellow-500',
	alto: 'text-red-500',
};

// Helper to highlight search terms
function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, term }: { text: string; term?: string }) {
	if (!(term && text)) return <>{text}</>;

	// Defensive: user-controlled term is used for highlighting
	const safeTerm = escapeRegExp(term.trim().slice(0, 100));
	if (!safeTerm) return <>{text}</>;

	let parts: string[];
	try {
		parts = text.split(new RegExp(`(${safeTerm})`, 'gi'));
	} catch {
		// If regex creation fails for any reason, fall back to plain text
		return <>{text}</>;
	}

	return (
		<>
			{parts.map((part, i) =>
				part.toLowerCase() === safeTerm.toLowerCase() ? (
					<mark
						key={i}
						className="bg-yellow-200 dark:bg-yellow-800 rounded-xs px-0.5 text-foreground"
					>
						{part}
					</mark>
				) : (
					part
				),
			)}
		</>
	);
}

export function StudentCard({ student, onClick, searchTerm }: StudentCardProps) {
	return (
		<Card
			className={cn(
				'transition-all hover:shadow-md cursor-pointer',
				onClick && 'hover:border-primary/50',
			)}
			onClick={onClick}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
							<User className="h-5 w-5 text-white" />
						</div>
						<div>
							<h3 className="font-semibold text-sm">
								<Highlight text={student.name} term={searchTerm} />
							</h3>
							<p className="text-xs text-muted-foreground">{student.profession}</p>
						</div>
					</div>
					<Badge variant={statusVariants[student.status]}>{statusLabels[student.status]}</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-3">
				{/* Contact Info */}
				<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<Phone className="h-3 w-3" />
						<Highlight text={student.phone} term={searchTerm} />
					</span>
					<span className="flex items-center gap-1">
						<Mail className="h-3 w-3" />
						<Highlight text={student.email} term={searchTerm} />
					</span>
				</div>

				{/* Clinic Info */}
				{student.hasClinic && student.clinicName && (
					<div className="flex items-center gap-1 text-xs text-muted-foreground">
						<Building2 className="h-3 w-3" />
						{student.clinicName}
						{student.clinicCity && ` - ${student.clinicCity}`}
					</div>
				)}

				{/* Footer */}
				<div className="flex items-center justify-between pt-2 border-t">
					<div className="flex items-center gap-2">
						<GraduationCap className="h-4 w-4 text-muted-foreground" />
						<span className="text-xs text-muted-foreground">
							Desde {formatDistanceToNow(student.createdAt, { locale: ptBR })}
						</span>
					</div>

					{student.churnRisk !== 'baixo' && (
						<div className={cn('flex items-center gap-1', churnRiskColors[student.churnRisk])}>
							<AlertTriangle className="h-3 w-3" />
							<span className="text-xs font-medium">Risco {student.churnRisk}</span>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
