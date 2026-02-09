import type { Control, FieldValues, Path } from 'react-hook-form';

import { trpc } from '../../lib/trpc';
import { Skeleton } from '../ui/skeleton';
import { CustomFieldRenderer } from './custom-field-renderer';

interface CustomFieldsSectionProps<T extends FieldValues> {
	entityType: 'lead' | 'student';
	control: Control<T>;
	// We construct the path to custom fields in the form data
	// Assuming the form stores them in a way we can map.
	// Actually, standard approach: The form schema should have a field like `customFields` object,
	// or we map flatly?
	// Plan 4.1 says "Insert <CustomFieldsSection ... />". "In onSubmit, collect custom field values".
	// The easiest way is to let the form handle state for each field by ID.
	// e.g. `customFields.${fieldId}`.
	// The Section component just renders them.
}

export function CustomFieldsSection<T extends FieldValues>({
	entityType,
	control,
}: CustomFieldsSectionProps<T>) {
	const { data: fields } = trpc.customFields.list.useQuery({ entityType });

	if (fields === undefined) {
		return (
			<div className="space-y-4 py-4">
				<Skeleton className="h-4 w-1/4" />
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			</div>
		);
	}

	if (fields.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4 py-4">
			<h3 className="font-medium text-lg">Campos Personalizados</h3>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{fields.map((field) => (
					<CustomFieldRenderer
						control={control}
						field={field}
						key={field.id}
						// Map the field ID to a path in the form data.
						// We'll use `customFields.${field.id}` as the key in the form object.
						// Cast to Path<T> is required but safe if we ensure T has `customFields` index signature or we ignore type strictness here for dynamic fields
						name={`customFields.${field.id}` as Path<T>}
					/>
				))}
			</div>
		</div>
	);
}
