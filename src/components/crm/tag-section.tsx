import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Tag } from 'lucide-react';

import { TagAutocomplete } from './tag-autocomplete';
import { TagBadge } from './tag-badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TagSectionProps {
	leadId: Id<'leads'>;
}

export function TagSection({ leadId }: TagSectionProps) {
	// biome-ignore lint/suspicious/noExplicitAny: break deep type instantiation
	const tags = useQuery((api as any).tags.getLeadTags, { leadId });

	return (
		<section className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="flex items-center gap-2 font-medium text-muted-foreground text-sm uppercase tracking-wider">
					<Tag className="h-4 w-4" /> Etiquetas
				</h3>
			</div>

			<div className="rounded-lg border border-border/50 bg-card p-4">
				{tags === undefined ? (
					<div className="flex flex-wrap gap-2">
						<Skeleton className="h-6 w-20 rounded-md" />
						<Skeleton className="h-6 w-24 rounded-md" />
						<Skeleton className="h-6 w-16 rounded-md" />
					</div>
				) : (
					<div className="space-y-3">
						{tags.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{tags.map((tag: Doc<'tags'>) => (
									<TagBadge key={tag._id} leadId={leadId} tag={tag} />
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-sm italic">Nenhuma etiqueta adicionada.</p>
						)}

						<div className="pt-2">
							<TagAutocomplete leadId={leadId} />
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
