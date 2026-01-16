/**
 * Payment Notifications
 *
 * Internal mutations for sending payment status notifications via email/WhatsApp.
 */

import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { internal } from './_generated/api';

/**
 * Send payment confirmed notification
 */
export const sendPaymentConfirmed = internalMutation({
	args: {
		paymentId: v.id('asaasPayments'),
		studentId: v.optional(v.id('students')),
	},
	handler: async (ctx, args) => {
		// Get payment details
		const payment = await ctx.db.get(args.paymentId);
		if (!payment) {
			console.error('sendPaymentConfirmed: Payment not found', args.paymentId);
			return { sent: false, reason: 'Payment not found' };
		}

		// Get student details if available
		let student = null;
		if (args.studentId) {
			student = await ctx.db.get(args.studentId);
		} else if (payment.studentId) {
			student = await ctx.db.get(payment.studentId);
		}

		if (!student) {
			return { sent: false, reason: 'No student linked' };
		}

		// Format values
		const formattedValue = new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(payment.value);

		// Send email via Brevo if student has email
		if (student.email) {
			try {
				// @ts-ignore - Deep type instantiation workaround
				await ctx.runMutation(internal.transactionalEmails.sendPaymentConfirmation, {
					studentId: student._id,
					paymentId: payment._id,
					paymentValue: formattedValue,
					paymentDescription: payment.description || 'Pagamento',
				});
			} catch (error) {
				console.error('sendPaymentConfirmed: Failed to send email', error);
			}
		}

		// Log notification
		await ctx.db.insert('notifications', {
			type: 'payment_confirmed',
			recipientId: student._id,
			recipientType: 'student',
			title: 'Pagamento Confirmado',
			message: `Seu pagamento de ${formattedValue} foi confirmado!`,
			channel: student.email ? 'email' : 'system',
			status: 'sent',
			metadata: {
				paymentId: payment._id,
				asaasPaymentId: payment.asaasPaymentId,
				value: payment.value,
			},
			createdAt: Date.now(),
		});

		return { sent: true };
	},
});

/**
 * Send payment overdue notification
 */
export const sendPaymentOverdue = internalMutation({
	args: {
		paymentId: v.id('asaasPayments'),
		studentId: v.optional(v.id('students')),
	},
	handler: async (ctx, args) => {
		// Get payment details
		const payment = await ctx.db.get(args.paymentId);
		if (!payment) {
			console.error('sendPaymentOverdue: Payment not found', args.paymentId);
			return { sent: false, reason: 'Payment not found' };
		}

		// Get student details
		let student = null;
		if (args.studentId) {
			student = await ctx.db.get(args.studentId);
		} else if (payment.studentId) {
			student = await ctx.db.get(payment.studentId);
		}

		if (!student) {
			return { sent: false, reason: 'No student linked' };
		}

		// Format values
		const formattedValue = new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(payment.value);

		const formattedDueDate = payment.dueDate
			? new Date(payment.dueDate).toLocaleDateString('pt-BR')
			: 'N/A';

		// Send email via Brevo if student has email
		if (student.email) {
			try {
				// @ts-ignore - Deep type instantiation workaround
				await ctx.runMutation(internal.transactionalEmails.sendPaymentReminder, {
					studentId: student._id,
					paymentId: payment._id,
					paymentValue: formattedValue,
					dueDate: formattedDueDate,
				});
			} catch (error) {
				console.error('sendPaymentOverdue: Failed to send email', error);
			}
		}

		// Log notification
		await ctx.db.insert('notifications', {
			type: 'payment_overdue',
			recipientId: student._id,
			recipientType: 'student',
			title: 'Pagamento Vencido',
			message: `Seu pagamento de ${formattedValue} venceu em ${formattedDueDate}. Por favor, regularize.`,
			channel: student.email ? 'email' : 'system',
			status: 'sent',
			metadata: {
				paymentId: payment._id,
				asaasPaymentId: payment.asaasPaymentId,
				value: payment.value,
				dueDate: payment.dueDate,
			},
			createdAt: Date.now(),
		});

		return { sent: true };
	},
});

/**
 * Send payment received notification
 */
export const sendPaymentReceived = internalMutation({
	args: {
		paymentId: v.id('asaasPayments'),
		studentId: v.optional(v.id('students')),
	},
	handler: async (ctx, args) => {
		// Similar to sendPaymentConfirmed but for RECEIVED status
		const payment = await ctx.db.get(args.paymentId);
		if (!payment) {
			return { sent: false, reason: 'Payment not found' };
		}

		let student = null;
		if (args.studentId) {
			student = await ctx.db.get(args.studentId);
		} else if (payment.studentId) {
			student = await ctx.db.get(payment.studentId);
		}

		if (!student) {
			return { sent: false, reason: 'No student linked' };
		}

		const formattedValue = new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(payment.value);

		// Log notification
		await ctx.db.insert('notifications', {
			type: 'payment_received',
			recipientId: student._id,
			recipientType: 'student',
			title: 'Pagamento Recebido',
			message: `Recebemos seu pagamento de ${formattedValue}. Obrigado!`,
			channel: 'system',
			status: 'sent',
			metadata: {
				paymentId: payment._id,
				asaasPaymentId: payment.asaasPaymentId,
				value: payment.value,
			},
			createdAt: Date.now(),
		});

		return { sent: true };
	},
});
