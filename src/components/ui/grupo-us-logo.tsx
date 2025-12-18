import { useId } from 'react';

import { cn } from '@/lib/utils';

export const GrupoUSLogo = ({ className }: { className?: string }) => {
	const gradientId = useId();
	const titleId = useId();

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 300 100"
			className={cn('h-full w-auto', className)}
			fill="none"
			aria-labelledby={titleId}
			role="img"
		>
			<title id={titleId}>Grupo US Logo</title>
			<defs>
				<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#C6A664" />
					<stop offset="100%" stopColor="#E5D398" />
				</linearGradient>
			</defs>

			{/* "G" - Stylized */}
			<path
				d="M 20 70 A 20 20 0 1 1 50 60 L 50 70 L 40 70"
				stroke={`url(#${gradientId})`}
				strokeWidth="3"
				strokeLinecap="round"
			/>

			{/* "U" - Connection to S */}
			<path
				d="M 120 20 L 120 70 A 30 30 0 0 0 180 70 L 180 40"
				stroke={`url(#${gradientId})`}
				strokeWidth="3"
				strokeLinecap="round"
			/>

			{/* "S" - Cosmic Loop */}
			<path
				d="M 180 40 A 20 20 0 1 1 210 50 A 20 20 0 1 0 240 60"
				stroke={`url(#${gradientId})`}
				strokeWidth="3"
				strokeLinecap="round"
			/>

			{/* Star embellishment */}
			<path
				d="M 120 10 L 122 18 L 130 20 L 122 22 L 120 30 L 118 22 L 110 20 L 118 18 Z"
				fill={`url(#${gradientId})`}
			/>

			<path
				d="M 240 50 L 241 54 L 245 55 L 241 56 L 240 60 L 239 56 L 235 55 L 239 54 Z"
				fill={`url(#${gradientId})`}
			/>

			{/* Text for "GRUPO" vertically or small?
           Based on image "GRUPO" is vertical on the left of "U".
           Let's approximate that.
       */}
			<text
				x="10"
				y="80"
				fill="#C6A664"
				fontFamily="Arial, sans-serif"
				fontSize="10"
				letterSpacing="2"
				transform="rotate(-90 20,60)"
			>
				GRUPO
			</text>
		</svg>
	);
};
