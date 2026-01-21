import type { ChangeEvent, ComponentProps, FocusEvent } from 'react';
import { forwardRef, useId, useImperativeHandle, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends ComponentProps<'input'> {
	label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, label, ...props }, ref) => {
		const [isFocused, setIsFocused] = useState(false);
		const [hasValue, setHasValue] = useState(false);
		const inputRef = useRef<HTMLInputElement>(null);
		const inputId = useId();

		useImperativeHandle(ref, () => {
			if (!inputRef.current) {
				throw new Error('Input ref is not available');
			}
			return inputRef.current;
		});

		const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);
			props.onFocus?.(e);
		};

		const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			setHasValue(e.target.value !== '');
			props.onBlur?.(e);
		};

		const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
			setHasValue(e.target.value !== '');
			props.onChange?.(e);
		};

		const shouldFloat = isFocused || hasValue || props.value || props.defaultValue;

		return (
			<div className="input-wrapper relative">
				{label && (
					<label
						className={cn(
							'input-label pointer-events-none absolute left-3 text-muted-foreground transition-all duration-200 ease-out',
							shouldFloat
								? 'top-0 -translate-y-1/2 scale-75 bg-background px-1 text-primary'
								: 'top-1/2 -translate-y-1/2 text-sm',
						)}
						htmlFor={inputId}
					>
						{label}
					</label>
				)}
				<input
					className={cn(
						'input-field flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-all file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
						label && 'pt-3',
						className,
					)}
					id={inputId}
					onBlur={handleBlur}
					onChange={handleChange}
					onFocus={handleFocus}
					ref={inputRef}
					type={type}
					{...props}
				/>
			</div>
		);
	},
);
Input.displayName = 'Input';

export { Input };
