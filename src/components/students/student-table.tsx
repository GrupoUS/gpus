'use client';

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
import type { StudentListItem } from '@/types/api';

// Enriched student type including mainProduct from students.list query
type EnrichedStudent = StudentListItem & { mainProduct?: string };

interface StudentsTableProps {
	students: EnrichedStudent[];
	onStudentClick: (studentId: number) => void;
}

type SortField = 'name' | 'status' | 'churnRisk' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortState {
	field: SortField;
	direction: SortDirection;
}

export function StudentsTable({ students, onStudentClick }: StudentsTableProps) {
	const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' });

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
			<ChevronUp className="ml-1 h-4 w-4" />
		) : (
			<ChevronDown className="ml-1 h-4 w-4" />
		);
	};

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<button
								aria-label="Ordenar por nome"
								className="flex items-center rounded font-medium transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								onClick={() => handleSort('name')}
								type="button"
							>
								Aluno
								{getSortIcon('name')}
							</button>
						</TableHead>
						<TableHead>Produto</TableHead>
						<TableHead>
							<button
								aria-label="Ordenar por status"
								className="flex items-center rounded font-medium transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								onClick={() => handleSort('status')}
								type="button"
							>
								Status
								{getSortIcon('status')}
							</button>
						</TableHead>
						<TableHead>
							<button
								aria-label="Ordenar por risco de churn"
								className="flex items-center rounded font-medium transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								onClick={() => handleSort('churnRisk')}
								type="button"
							>
								Risco
								{getSortIcon('churnRisk')}
							</button>
						</TableHead>
						<TableHead className="w-10" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedStudents.map((student) => {
						return (
							<TableRow
								aria-label={`Ver detalhes de ${student.name}`}
								className="cursor-pointer transition-colors hover:bg-muted/50"
								key={student.id}
								onClick={() => onStudentClick(student.id)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onStudentClick(student.id);
									}
								}}
								role="button"
								tabIndex={0}
							>
								<TableCell>
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-indigo-500">
											<User className="h-4 w-4 text-white" />
										</div>
										<div>
											<p className="font-medium text-sm">{student.name}</p>
											<p className="text-muted-foreground text-xs">{student.profession}</p>
										</div>
									</div>
								</TableCell>
								<TableCell>
									{student.mainProduct ? (
										<Badge variant="outline">
											{productLabels[student.mainProduct] || student.mainProduct}
										</Badge>
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
											<span className="font-medium text-xs capitalize">{student.churnRisk}</span>
										</div>
									) : (
										<span className="font-medium text-green-500 text-xs">Baixo</span>
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
