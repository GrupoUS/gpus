import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { LeadDeleteDialog } from './lead-delete-dialog';
import { LeadEditDialog } from './lead-edit-dialog';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Lead } from '@/types/api';

interface LeadActionsProps {
	lead: Lead;
	onClose?: () => void;
}

export function LeadActions({ lead, onClose }: LeadActionsProps) {
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className="h-8 w-8 p-0" variant="ghost">
						<span className="sr-only">Abrir menu</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
						<Pencil className="mr-2 h-4 w-4" />
						Editar
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="text-destructive focus:text-destructive"
						onClick={() => setDeleteDialogOpen(true)}
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Excluir
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<LeadEditDialog lead={lead} onOpenChange={setEditDialogOpen} open={editDialogOpen} />

			<LeadDeleteDialog
				lead={lead}
				onClose={onClose}
				onOpenChange={setDeleteDialogOpen}
				open={deleteDialogOpen}
			/>
		</>
	);
}
