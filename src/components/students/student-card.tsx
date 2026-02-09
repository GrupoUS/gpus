'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Building2, GraduationCap, Mail, Phone, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StudentListItem } from '@/types/api';

interface StudentCardProps {
	student: StudentListItem;
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

function Highlight({ text, term }: { text?: string; term?: string }) {
	if (!text) return null;
	if (!term) return <>{text}</>;

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
						className="rounded-xs bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-800"
						key={i}
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
				'cursor-pointer transition-all hover:shadow-md',
				onClick && 'hover:border-primary/50',
			)}
			onClick={onClick}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-indigo-500">
							<User className="h-5 w-5 text-white" />
						</div>
						<div>
							<h3 className="font-semibold text-sm">
								<Highlight term={searchTerm} text={student.name} />
							</h3>
							<p className="text-muted-foreground text-xs">{student.profession}</p>
						</div>
					</div>
					<Badge variant={statusVariants[student.status]}>{statusLabels[student.status]}</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-3">
				{/* Contact Info */}
				<div className="flex flex-wrap gap-3 text-muted-foreground text-xs">
					<span className="flex items-center gap-1">
						<Phone className="h-3 w-3" />
						<Highlight term={searchTerm} text={student.phone} />
					</span>
					<span className="flex items-center gap-1">
						<Mail className="h-3 w-3" />
						<Highlight term={searchTerm} text={student.email} />
					</span>
				</div>

				{/* Clinic Info */}
				{student.hasClinic && student.clinicName && (
					<div className="flex items-center gap-1 text-muted-foreground text-xs">
						<Building2 className="h-3 w-3" />
						{student.clinicName}
						{student.clinicCity && ` - ${student.clinicCity}`}
					</div>
				)}

				{/* Footer */}
				<div className="flex items-center justify-between border-t pt-2">
					<div className="flex items-center gap-2">
						<GraduationCap className="h-4 w-4 text-muted-foreground" />
						<span className="text-muted-foreground text-xs">
							Desde {formatDistanceToNow(student.createdAt, { locale: ptBR })}
						</span>
					</div>

					{student.churnRisk !== 'baixo' && (
						<div className={cn('flex items-center gap-1', churnRiskColors[student.churnRisk])}>
							<AlertTriangle className="h-3 w-3" />
							<span className="font-medium text-xs">Risco {student.churnRisk}</span>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
