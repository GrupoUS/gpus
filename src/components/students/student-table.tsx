'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { AlertTriangle, ChevronDown, ChevronRight, ChevronUp, User } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	churnRiskColors,
	productLabels,
	studentStatusLabels,
	studentStatusVariants,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

interface StudentsTableProps {
	students: Doc<'students'>[];
	onStudentClick: (studentId: Id<'students'>) => void;
}

type SortField = 'name' | 'status' | 'churnRisk' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortState {
	field: SortField;
	direction: SortDirection;
}

export function StudentsTable({ students, onStudentClick }: StudentsTableProps) {
	const _navigate = useNavigate();
	const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' });
	// Get enrollments for product display
	const enrollments = useQuery(api.enrollments.list, {});

	// Create a map of studentId to their first enrollment product
	const studentProducts =
		enrollments?.reduce(
			(acc: Record<string, string>, e: Doc<'enrollments'>) => {
				if (e.studentId && !acc[e.studentId]) {
					acc[e.studentId] = e.product;
				}
				return acc;
			},
			{} as Record<string, string>,
		) ?? {};

	const handleSort = (field: SortField) => {
		setSort((current) => ({
			field,
			direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
		}));
	};

	const sortedStudents = [...students].sort((a, b) => {
		const { field, direction } = sort;

		let aValue: string | number;
		let bValue: string | number;

		switch (field) {
			case 'name':
				aValue = a.name.toLowerCase();
				bValue = b.name.toLowerCase();
				break;
			case 'status':
				aValue = a.status;
				bValue = b.status;
				break;
			case 'churnRisk': {
				const riskOrder = { baixo: 1, medio: 2, alto: 3 };
				aValue = riskOrder[a.churnRisk] || 0;
				bValue = riskOrder[b.churnRisk] || 0;
				break;
			}
			case 'createdAt':
				aValue = a.createdAt || 0;
				bValue = b.createdAt || 0;
				break;
			default:
				return 0;
		}

		if (aValue < bValue) return direction === 'asc' ? -1 : 1;
		if (aValue > bValue) return direction === 'asc' ? 1 : -1;
		return 0;
	});

	const getSortIcon = (field: SortField) => {
		if (sort.field !== field) return null;
		return sort.direction === 'asc' ? (
			<ChevronUp className="h-4 w-4 ml-1" />
		) : (
			<ChevronDown className="h-4 w-4 ml-1" />
		);
	};

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<button
								type="button"
								onClick={() => handleSort('name')}
								className="flex items-center hover:text-foreground transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
								aria-label="Ordenar por nome"
							>
								Aluno
								{getSortIcon('name')}
							</button>
						</TableHead>
						<TableHead>Produto</TableHead>
						<TableHead>
							<button
								type="button"
								onClick={() => handleSort('status')}
								className="flex items-center hover:text-foreground transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
								aria-label="Ordenar por status"
							>
								Status
								{getSortIcon('status')}
							</button>
						</TableHead>
						<TableHead>
							<button
								type="button"
								onClick={() => handleSort('churnRisk')}
								className="flex items-center hover:text-foreground transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
								aria-label="Ordenar por risco de churn"
							>
								Risco
								{getSortIcon('churnRisk')}
							</button>
						</TableHead>
						<TableHead className="w-10" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedStudents.map((student: Doc<'students'>) => {
						const product = studentProducts[student._id];
						return (
							<TableRow
								key={student._id}
								className="cursor-pointer hover:bg-muted/50 transition-colors"
								onClick={() => onStudentClick(student._id)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onStudentClick(student._id);
									}
								}}
								tabIndex={0}
								role="button"
								aria-label={`Ver detalhes de ${student.name}`}
							>
								<TableCell>
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
											<User className="h-4 w-4 text-white" />
										</div>
										<div>
											<p className="font-medium text-sm">{student.name}</p>
											<p className="text-xs text-muted-foreground">{student.profession}</p>
										</div>
									</div>
								</TableCell>
								<TableCell>
									{product ? (
										<Badge variant="outline">{productLabels[product] || product}</Badge>
									) : (
										<span className="text-muted-foreground text-sm">-</span>
									)}
								</TableCell>
								<TableCell>
									<Badge variant={studentStatusVariants[student.status]}>
										{studentStatusLabels[student.status]}
									</Badge>
								</TableCell>
								<TableCell>
									{student.churnRisk !== 'baixo' ? (
										<div
											className={cn('flex items-center gap-1', churnRiskColors[student.churnRisk])}
										>
											<AlertTriangle className="h-3 w-3" />
											<span className="text-xs font-medium capitalize">{student.churnRisk}</span>
										</div>
									) : (
										<span className="text-green-500 text-xs font-medium">Baixo</span>
									)}
								</TableCell>
								<TableCell>
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
