import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import type { Control } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatPhoneNumber } from '@/lib/utils/phone-mask';
import { interestOptions, type LeadCaptureFormData } from '@/lib/validations/lead-capture-schema';

const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

interface LeadCaptureFormFieldsProps {
	control: Control<LeadCaptureFormData>;
	disabled?: boolean;
}

export function LeadCaptureFormFields({ control, disabled }: LeadCaptureFormFieldsProps) {
	return (
		<motion.div animate="show" className="space-y-4" initial="hidden" variants={containerVariants}>
			{/* Name */}
			<motion.div variants={itemVariants}>
				<FormField
					control={control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nome Completo</FormLabel>
							<FormControl>
								<Input disabled={disabled} placeholder="Seu nome" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</motion.div>

			{/* Phone */}
			<motion.div variants={itemVariants}>
				<FormField
					control={control}
					name="phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel>WhatsApp</FormLabel>
							<FormControl>
								<Input
									disabled={disabled}
									placeholder="(11) 99999-9999"
									type="tel"
									{...field}
									maxLength={15}
									onChange={(e) => {
										const formatted = formatPhoneNumber(e.target.value);
										field.onChange(formatted);
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</motion.div>

			{/* Interest */}
			<motion.div variants={itemVariants}>
				<FormField
					control={control}
					name="interest"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tenho interesse em</FormLabel>
							<Select disabled={disabled} onValueChange={field.onChange} value={field.value ?? ''}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecione uma opção" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{interestOptions.map((option) => (
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
			</motion.div>

			{/* Email */}
			<motion.div variants={itemVariants}>
				<FormField
					control={control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input disabled={disabled} placeholder="seu@email.com" type="email" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</motion.div>

			{/* Message */}
			<motion.div variants={itemVariants}>
				<FormField
					control={control}
					name="message"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Mensagem (Opcional)</FormLabel>
							<FormControl>
								<Textarea
									className="resize-none"
									disabled={disabled}
									placeholder="Como podemos ajudar?"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</motion.div>

			<motion.div className="space-y-3 pt-2" variants={itemVariants}>
				{/* LGPD Consent */}
				<FormField
					control={control}
					name="lgpdConsent"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
							<FormControl>
								<Checkbox
									checked={field.value}
									disabled={disabled}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>
									Concordo com a{' '}
									<Link className="text-primary hover:underline" target="_blank" to="/">
										Política de Privacidade
									</Link>
								</FormLabel>
								<FormMessage />
							</div>
						</FormItem>
					)}
				/>

				{/* WhatsApp Consent */}
				<FormField
					control={control}
					name="whatsappConsent"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 p-1">
							<FormControl>
								<Checkbox
									checked={field.value}
									disabled={disabled}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel className="font-normal">Aceito receber contatos via WhatsApp</FormLabel>
							</div>
						</FormItem>
					)}
				/>
			</motion.div>
		</motion.div>
	);
}
