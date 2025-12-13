import * as React from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends React.ComponentProps<'input'> {
	label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, label, ...props }, ref) => {
		const [isFocused, setIsFocused] = React.useState(false);
		const [hasValue, setHasValue] = React.useState(false);
		const inputRef = React.useRef<HTMLInputElement>(null);

		React.useImperativeHandle(ref, () => inputRef.current!);

		const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);
			props.onFocus?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			setHasValue(e.target.value !== '');
			props.onBlur?.(e);
		};

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setHasValue(e.target.value !== '');
			props.onChange?.(e);
		};

		const shouldFloat = isFocused || hasValue || props.value || props.defaultValue;

		return (
			<div className="input-wrapper relative">
				{label && (
					<label
						className={cn(
							'input-label absolute left-3 pointer-events-none transition-all duration-200 ease-out text-muted-foreground',
							shouldFloat
								? 'top-0 -translate-y-1/2 scale-75 bg-background px-1 text-primary'
								: 'top-1/2 -translate-y-1/2 text-sm',
						)}
					>
						{label}
					</label>
				)}
				<input
					type={type}
					className={cn(
						'input-field flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
						label && 'pt-3',
						className,
					)}
					ref={inputRef}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onChange={handleChange}
					{...props}
				/>
			</div>
		);
	},
);
Input.displayName = 'Input';

export { Input };
