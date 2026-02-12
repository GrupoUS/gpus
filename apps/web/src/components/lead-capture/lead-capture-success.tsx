import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface LeadCaptureSuccessProps {
	onReset: () => void;
}

export function LeadCaptureSuccess({ onReset }: LeadCaptureSuccessProps) {
	return (
		<div className="rounded-xl border bg-card p-8 text-center shadow-sm">
			<motion.div
				animate={{ scale: 1, opacity: 1 }}
				className="flex flex-col items-center justify-center space-y-4"
				initial={{ scale: 0.8, opacity: 0 }}
			>
				<div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
					<CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
				</div>
				<h3 className="font-bold text-2xl">Sucesso!</h3>
				<p className="text-muted-foreground">
					Recebemos seus dados e entraremos em contato em breve.
				</p>
				<Button className="mt-4" onClick={onReset} variant="outline">
					Enviar nova mensagem
				</Button>
			</motion.div>
		</div>
	);
}
