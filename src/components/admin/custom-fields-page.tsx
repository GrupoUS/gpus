import { useMutation, useQuery } from 'convex/react';
import { List, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { CustomFieldFormDialog } from './custom-field-form-dialog';

export function CustomFieldsPage() {
	const [activeTab, setActiveTab] = useState<'lead' | 'student'>('lead');
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingField, setEditingField] = useState<Doc<'customFields'> | null>(null);

	const fields = useQuery(api.customFields.listCustomFields, { entityType: activeTab });
	const deleteField = useMutation(api.customFields.deleteCustomField);

	const handleEdit = (field: Doc<'customFields'>) => {
		setEditingField(field);
		setDialogOpen(true);
	};

	const handleCreate = () => {
		setEditingField(null);
		setDialogOpen(true);
	};

	const handleDelete = async (id: Doc<'customFields'>['_id']) => {
		try {
			await deleteField({ id });
			toast.success('Campo excluído com sucesso');
		} catch (_error) {
			toast.error('Erro ao excluir campo');
		}
	};

	const getTypeName = (type: string) => {
		const types: Record<string, string> = {
			text: 'Texto',
			number: 'Número',
			date: 'Data',
			select: 'Seleção Única',
			multiselect: 'Seleção Múltipla',
			boolean: 'Sim/Não',
		};
		return types[type] || type;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl tracking-tight">Campos Personalizados</h2>
					<p className="text-muted-foreground">
						Gerencie os campos adicionais para seus leads e alunos.
					</p>
				</div>
				<Button onClick={handleCreate}>
					<Plus className="mr-2 h-4 w-4" />
					Novo Campo
				</Button>
			</div>

			<CustomFieldFormDialog
				initialData={editingField}
				onOpenChange={setDialogOpen}
				open={dialogOpen}
			/>

			<Tabs
				className="space-y-4"
				defaultValue="lead"
				onValueChange={(value) => setActiveTab(value as 'lead' | 'student')}
				value={activeTab}
			>
				<TabsList>
					<TabsTrigger value="lead">Leads</TabsTrigger>
					<TabsTrigger value="student">Alunos</TabsTrigger>
				</TabsList>

				<Card>
					<CardHeader>
						<CardTitle>Campos de {activeTab === 'lead' ? 'Leads' : 'Alunos'}</CardTitle>
						<CardDescription>
							Campos personalizados ativos para este tipo de entidade.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{fields && fields.length === 0 && (
							<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
								<List className="mb-4 h-10 w-10 opacity-20" />
								<p>Nenhum campo personalizado encontrado.</p>
								<Button onClick={handleCreate} variant="link">
									Criar o primeiro campo
								</Button>
							</div>
						)}

						{fields && fields.length > 0 && (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nome</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead>Obrigatório</TableHead>
										<TableHead>Opções</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{fields.map((field) => (
										<TableRow key={field._id}>
											<TableCell className="font-medium">{field.name}</TableCell>
											<TableCell>
												<Badge variant="outline">{getTypeName(field.fieldType)}</Badge>
											</TableCell>
											<TableCell>
												{field.required ? (
													<Badge className="text-xs" variant="destructive">
														Sim
													</Badge>
												) : (
													<span className="text-muted-foreground text-sm">Não</span>
												)}
											</TableCell>
											<TableCell>
												{field.options ? (
													<span className="text-muted-foreground text-xs">
														{field.options.length} opções
													</span>
												) : (
													'-'
												)}
											</TableCell>
											<TableCell className="space-x-2 text-right">
												<Button onClick={() => handleEdit(field)} size="icon" variant="ghost">
													<Pencil className="h-4 w-4" />
												</Button>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button className="text-destructive" size="icon" variant="ghost">
															<Trash2 className="h-4 w-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>Excluir campo personalizado?</AlertDialogTitle>
															<AlertDialogDescription>
																Tem certeza que deseja excluir este campo? Os dados existentes serão
																preservados mas o campo ficará oculto.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Cancelar</AlertDialogCancel>
															<AlertDialogAction onClick={() => handleDelete(field._id)}>
																Excluir
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}

						{!fields && (
							<div className="space-y-2">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</div>
						)}
					</CardContent>
				</Card>
			</Tabs>
		</div>
	);
}
