import { Link } from '@tanstack/react-router';
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

interface LeadFormFieldsProps {
	control: Control<LeadCaptureFormData>;
	disabled?: boolean;
}

export function LeadFormFields({ control, disabled }: LeadFormFieldsProps) {
	return (
		<div className="space-y-4">
			{/* Name */}
			<FormField
				control={control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nome Completo</FormLabel>
						<FormControl>
							<Input placeholder="Seu nome" disabled={disabled} {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Phone */}
			<FormField
				control={control}
				name="phone"
				render={({ field }) => (
					<FormItem>
						<FormLabel>WhatsApp</FormLabel>
						<FormControl>
							<Input
								placeholder="(11) 99999-9999"
								type="tel"
								disabled={disabled}
								{...field}
								onChange={(e) => {
									const formatted = formatPhoneNumber(e.target.value);
									field.onChange(formatted);
								}}
								maxLength={15}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Interest */}
			<FormField
				control={control}
				name="interest"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Tenho interesse em</FormLabel>
						<Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
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

			{/* Email */}
			<FormField
				control={control}
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Email</FormLabel>
						<FormControl>
							<Input placeholder="seu@email.com" type="email" disabled={disabled} {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Message */}
			<FormField
				control={control}
				name="message"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Mensagem (Opcional)</FormLabel>
						<FormControl>
							<Textarea
								placeholder="Como podemos ajudar?"
								className="resize-none"
								disabled={disabled}
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="space-y-3 pt-2">
				{/* LGPD Consent */}
				<FormField
					control={control}
					name="lgpdConsent"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
									disabled={disabled}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>
									Concordo com a{' '}
									<Link to="/" className="text-primary hover:underline" target="_blank">
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
									onCheckedChange={field.onChange}
									disabled={disabled}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel className="font-normal">Aceito receber contatos via WhatsApp</FormLabel>
							</div>
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
}
