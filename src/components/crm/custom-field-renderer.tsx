import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import type { Doc } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';

interface CustomFieldRendererProps<T extends FieldValues> {
	field: Doc<'customFields'>;
	control: Control<T>;
	name: Path<T>;
	disabled?: boolean;
}

export function CustomFieldRenderer<T extends FieldValues>({
	field,
	control,
	name,
	disabled,
}: CustomFieldRendererProps<T>) {
	const label = field.name;
	const isRequired = field.required;

	// Helper to render label with required asterisk
	const LabelComponent = () => (
		<FormLabel>
			{label} {isRequired && <span className="text-destructive">*</span>}
		</FormLabel>
	);

	if (field.fieldType === 'text') {
		return (
			<FormField
				control={control}
				name={name}
				render={({ field: formField }) => (
					<FormItem>
						<LabelComponent />
						<FormControl>
							<Input {...formField} disabled={disabled} value={formField.value || ''} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}

	if (field.fieldType === 'number') {
		return (
			<FormField
				control={control}
				name={name}
				render={({ field: formField }) => (
					<FormItem>
						<LabelComponent />
						<FormControl>
							<Input
								type="number"
								{...formField}
								disabled={disabled}
								onChange={(e) => {
									const val = e.target.value === '' ? undefined : Number(e.target.value);
									formField.onChange(val);
								}}
								value={formField.value ?? ''}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}

	if (field.fieldType === 'boolean') {
		return (
			<FormField
				control={control}
				name={name}
				render={({ field: formField }) => (
					<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
						<FormControl>
							<Checkbox
								checked={formField.value}
								disabled={disabled}
								onCheckedChange={formField.onChange}
							/>
						</FormControl>
						<div className="space-y-1 leading-none">
							<LabelComponent />
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}

	if (field.fieldType === 'date') {
		return (
			<FormField
				control={control}
				name={name}
				render={({ field: formField }) => (
					<FormItem className="flex flex-col">
						<LabelComponent />
						<Popover>
							<PopoverTrigger asChild>
								<FormControl>
									<Button
										className={cn(
											'w-full pl-3 text-left font-normal',
											!formField.value && 'text-muted-foreground',
										)}
										disabled={disabled}
										variant={'outline'}
									>
										{formField.value ? (
											format(new Date(formField.value), 'PPP', { locale: ptBR })
										) : (
											<span>Selecione uma data</span>
										)}
										<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
									</Button>
								</FormControl>
							</PopoverTrigger>
							<PopoverContent align="start" className="w-auto p-0">
								<Calendar
									disabled={
										(date) => date < new Date('1900-01-01') // Example constraint
									}
									initialFocus
									mode="single"
									// Storing as timestamp to match typical Convex patterns, or ISO string?
									// Plan 5.2 validation checked type number OR string.
									onSelect={(date) => formField.onChange(date ? date.getTime() : undefined)}
									selected={formField.value ? new Date(formField.value) : undefined}
								/>
							</PopoverContent>
						</Popover>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}

	if (field.fieldType === 'select') {
		return (
			<FormField
				control={control}
				name={name}
				render={({ field: formField }) => (
					<FormItem>
						<LabelComponent />
						<Select
							defaultValue={formField.value}
							disabled={disabled}
							onValueChange={formField.onChange}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Selecione..." />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{field.options?.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}

	if (field.fieldType === 'multiselect') {
		// Multiselect implementation using Checkboxes or a specific component
		// Simple version: List of checkboxes
		return (
			<FormField
				control={control}
				name={name}
				render={() => (
					<FormItem>
						<LabelComponent />
						<div className="grid grid-cols-2 gap-2 rounded-md border p-2">
							{field.options?.map((option) => (
								<FormField
									control={control}
									key={option}
									name={name}
									render={({ field: formField }) => {
										const valueArray = (formField.value as string[]) || [];
										return (
											<FormItem
												className="flex flex-row items-start space-x-3 space-y-0"
												key={option}
											>
												<FormControl>
													<Checkbox
														checked={valueArray.includes(option)}
														disabled={disabled}
														onCheckedChange={(checked) => {
															const newValue = checked
																? [...valueArray, option]
																: valueArray.filter((v) => v !== option);
															formField.onChange(newValue);
														}}
													/>
												</FormControl>
												<FormLabel className="font-normal">{option}</FormLabel>
											</FormItem>
										);
									}}
								/>
							))}
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}

	return null;
}
