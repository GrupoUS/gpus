import * as React from 'react';

import { cn } from '@/lib/utils';

interface MotionWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	stagger?: number;
	delay?: number;
}

export function MotionWrapper({ children, className, stagger = 0, delay = 0, ...props }: MotionWrapperProps) {
	const [isVisible, setIsVisible] = React.useState(false);
	const ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{
				threshold: 0.1,
				rootMargin: '50px',
			},
		);

		if (ref.current) {
			observer.observe(ref.current);
		}

		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<div
			ref={ref}
			className={cn(
				'transition-opacity duration-700 ease-out',
				isVisible ? 'opacity-100' : 'opacity-0',
				className,
			)}
			style={{
				transitionDelay: isVisible ? `${delay}ms` : '0ms',
				transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
				transition: `opacity 700ms ease-out ${delay}ms, transform 700ms ease-out ${delay}ms`,
			}}
			{...props}
		>
			{React.Children.map(children, (child, index) => {
				if (React.isValidElement(child)) {
					return React.cloneElement(child, {
						className: cn(
							child.props.className,
							'transition-opacity duration-700 ease-out',
							isVisible ? 'opacity-100' : 'opacity-0',
						),
						style: {
							...child.props.style,
							transitionDelay: isVisible ? `${delay + index * stagger}ms` : '0ms',
							transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
							transition: `opacity 700ms ease-out ${delay + index * stagger}ms, transform 700ms ease-out ${delay + index * stagger}ms`,
						},
					} as any);
				}
				return child;
			})}
		</div>
	);
}

