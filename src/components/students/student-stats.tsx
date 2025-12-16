import { GraduationCap, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentStatsProps {
	totalStudents: number;
	activeStudents: number;
	highRiskStudents: number;
}

export function StudentStats({
	totalStudents,
	activeStudents,
	highRiskStudents,
}: StudentStatsProps) {
	return (
		<div className="grid gap-4 md:grid-cols-3">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{totalStudents}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
					<GraduationCap className="h-4 w-4 text-green-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-green-600">{activeStudents}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Risco de Churn</CardTitle>
					<Users className="h-4 w-4 text-red-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-red-600">{highRiskStudents}</div>
				</CardContent>
			</Card>
		</div>
	);
}
