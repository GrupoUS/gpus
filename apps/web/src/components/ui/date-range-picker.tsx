'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerWithRangeProps extends HTMLAttributes<HTMLDivElement> {
	date: DateRange | undefined;
	setDate: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({ className, date, setDate }: DatePickerWithRangeProps) {
	let dateLabel: ReactNode;
	if (date?.from) {
		if (date.to) {
			dateLabel = (
				<>
					{format(date.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
					{format(date.to, 'dd/MM/yyyy', { locale: ptBR })}
				</>
			);
		} else {
			dateLabel = format(date.from, 'dd/MM/yyyy', { locale: ptBR });
		}
	} else {
		dateLabel = <span>Selecione uma data</span>;
	}

	return (
		<div className={cn('grid gap-2', className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						className={cn(
							'box-border w-[260px] justify-start text-left font-normal',
							!date && 'text-muted-foreground',
						)}
						variant={'outline'}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{dateLabel}
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-auto p-0">
					<Calendar
						defaultMonth={date?.from}
						initialFocus
						locale={ptBR}
						mode="range"
						numberOfMonths={2}
						onSelect={setDate}
						selected={date}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
