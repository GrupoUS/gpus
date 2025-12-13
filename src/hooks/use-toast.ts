import { toast } from 'sonner';

export interface ToastProps {
	title?: string;
	description?: string;
	variant?: 'default' | 'destructive';
}

export function useToast() {
	return {
		toast: ({ title, description, variant = 'default' }: ToastProps) => {
			if (variant === 'destructive') {
				toast.error(title || 'Erro', {
					description,
				});
			} else {
				toast.success(title || 'Sucesso', {
					description,
				});
			}
		},
	};
}
