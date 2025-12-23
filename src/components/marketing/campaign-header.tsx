'use client';

import { useNavigate } from '@tanstack/react-router';
import { LayoutGrid, List, Mail, Plus, TableIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface CampaignHeaderProps {
	view: 'grid' | 'table';
	search: string;
	status: string;
	page: number;
}

export function CampaignHeader({ view, search, status, page }: CampaignHeaderProps) {
	const navigate = useNavigate();

	const handleViewChange = (newView: 'grid' | 'table') => {
		void navigate({
			to: '/marketing',
			search: { search, status, page, view: newView },
		});
	};

	const handleNewCampaign = () => {
		void navigate({
			to: '/marketing/nova',
			search: { search: '', status: 'all', view: 'grid', page: 1 },
		});
	};

	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="text-2xl font-bold flex items-center gap-2">
					<Mail className="h-6 w-6 text-purple-500" />
					Marketing
				</h1>
				<p className="text-muted-foreground">Gerencie suas campanhas de email</p>
			</div>
			<div className="flex items-center gap-2">
				{/* View Toggle */}
				<div className="flex gap-1 border rounded-md p-1">
					<Button
						variant={view === 'grid' ? 'secondary' : 'ghost'}
						size="sm"
						className="h-8 w-8 p-0"
						onClick={() => handleViewChange('grid')}
					>
						<LayoutGrid className="h-4 w-4" />
					</Button>
					<Button
						variant={view === 'table' ? 'secondary' : 'ghost'}
						size="sm"
						className="h-8 w-8 p-0"
						onClick={() => handleViewChange('table')}
					>
						<TableIcon className="h-4 w-4" />
					</Button>
				</div>
				<Button
					variant="outline"
					onClick={() => {
						void navigate({
							to: '/marketing/listas',
							search: { search: '', status: 'all', view: 'grid', page: 1 },
						});
					}}
				>
					<List className="h-4 w-4 mr-2" />
					Listas
				</Button>
				<Button onClick={handleNewCampaign}>
					<Plus className="h-4 w-4 mr-2" />
					Nova Campanha
				</Button>
			</div>
		</div>
	);
}
