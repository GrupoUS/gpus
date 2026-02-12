import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { trpc } from '../../lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types/api';

interface TagBadgeProps {
	tag: Tag;
	leadId: number;
	onRemove?: () => void;
}

export function TagBadge({ tag, leadId, onRemove }: TagBadgeProps) {
	const removeTag = trpc.tags.removeTagFromLead.useMutation();
	const [isRemoving, setIsRemoving] = useState(false);

	const handleRemove = async () => {
		setIsRemoving(true);
		try {
			await removeTag.mutateAsync({ leadId, tagId: tag.id });
			toast.success('Tag removida');
			onRemove?.();
		} catch (_error) {
			toast.error('Erro ao remover tag');
		} finally {
			setIsRemoving(false);
		}
	};

	// Calculate contrast for text color
	const getContrastColor = (hexColor: string) => {
		const r = Number.parseInt(hexColor.slice(1, 3), 16);
		const g = Number.parseInt(hexColor.slice(3, 5), 16);
		const b = Number.parseInt(hexColor.slice(5, 7), 16);
		const yiq = (r * 299 + g * 587 + b * 114) / 1000;
		return yiq >= 128 ? '#000000' : '#ffffff';
	};

	const textColor = getContrastColor(tag.color || '#000000');

	return (
		<Badge
			className={cn('gap-1 pr-1 transition-colors hover:bg-opacity-90')}
			style={{
				backgroundColor: (tag.color ?? undefined) as any,
				color: textColor,
				borderColor: 'transparent',
			}}
			variant="outline"
		>
			{tag.displayName || tag.name}
			<Button
				className={cn(
					'h-4 w-4 rounded-full bg-black/10 p-0 hover:bg-black/20',
					textColor === '#ffffff' ? 'text-white' : 'text-black',
				)}
				disabled={isRemoving}
				onClick={handleRemove}
				size="icon"
				variant="ghost"
			>
				{isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
				<span className="sr-only">Remover tag</span>
			</Button>
		</Badge>
	);
}
