/**
 * Transactional Emails Module
 *
 * High-level actions for sending transactional (non-campaign) emails.
 * These emails are sent immediately and include:
 * - Welcome emails for new leads
 * - Enrollment confirmations for students
 * - Class reminders
 * - Password reset emails
 * - Generic transactional emails
 *
 * Uses Brevo SMTP API for immediate delivery.
 * All sends are logged in emailEvents table for tracking.
 */

import { v } from 'convex/values';

import { internal } from './_generated/api';
import { action, internalMutation, internalQuery } from './_generated/server';
import { brevoSmtp } from './lib/brevo';

// Type assertion helper for internal functions during code generation bootstrap
// biome-ignore lint/suspicious/noExplicitAny: Required for Convex internal API bootstrap
const InternalAny: any = internal;
// biome-ignore lint/suspicious/noExplicitAny: Required for Convex internal API bootstrap
const internalTransactionalEmails: Record<string, any> = InternalAny.transactionalEmails;

// ═══════════════════════════════════════════════════════
// INTERNAL QUERIES
// ═══════════════════════════════════════════════════════

/**
 * Get lead data for transactional email
 */
export const getLeadForEmail = internalQuery({
	args: { leadId: v.id('leads') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.leadId);
	},
});

/**
 * Get student data for transactional email
 */
export const getStudentForEmail = internalQuery({
	args: { studentId: v.id('students') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.studentId);
	},
});

// ═══════════════════════════════════════════════════════
// INTERNAL MUTATIONS
// ═══════════════════════════════════════════════════════

/**
 * Log transactional email send in emailEvents table
 */
export const logTransactionalEmailSend = internalMutation({
	args: {
		email: v.string(),
		emailType: v.string(),
		messageId: v.string(),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('emailEvents', {
			email: args.email,
			eventType: 'delivered', // Assume delivered for transactional (Brevo webhook will update if bounced)
			timestamp: Date.now(),
			brevoMessageId: args.messageId,
			metadata: {
				type: 'transactional',
				emailType: args.emailType,
				...args.metadata,
			},
			createdAt: Date.now(),
		});
	},
});

// ═══════════════════════════════════════════════════════
// TRANSACTIONAL EMAIL ACTIONS
// ═══════════════════════════════════════════════════════

/**
 * Send a welcome email to a new lead
 *
 * Called after lead creation to introduce them to the platform.
 */
export const sendWelcomeEmailToLead = action({
	args: { leadId: v.id('leads') },
	handler: async (ctx, args) => {
		// Get lead data
		const lead = await ctx.runQuery(internalTransactionalEmails.getLeadForEmail, {
			leadId: args.leadId,
		});

		if (!lead) {
			throw new Error('Lead não encontrado');
		}

		if (!lead.email) {
			throw new Error('Lead não possui email cadastrado');
		}

		const firstName = lead.name?.split(' ')[0] || 'Visitante';

		// Build welcome email HTML
		const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo(a), ${firstName}! 🎉</h1>
  </div>
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Olá ${firstName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Ficamos muito felizes em ter você conosco! Você acaba de dar o primeiro passo para transformar sua carreira na área de estética e saúde.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      <strong>O que vem a seguir?</strong>
    </p>
    <ul style="font-size: 16px; line-height: 1.8; color: #333;">
      <li>Nossa equipe entrará em contato em breve</li>
      <li>Você receberá informações sobre nossos cursos</li>
      <li>Fique de olho em conteúdos exclusivos no seu email</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://drasacha.com.br" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
        Conhecer Cursos
      </a>
    </div>
    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
      Qualquer dúvida, estamos à disposição!<br>
      <strong>Equipe GRUPOUS</strong>
    </p>
  </div>
</body>
</html>`;

		// Send via Brevo SMTP
		const result = await brevoSmtp.sendHtml(
			{ email: lead.email, name: lead.name || undefined },
			'Bem-vindo(a) ao GRUPOUS! 🎉',
			htmlContent,
			{ tags: ['welcome', 'lead'] },
		);

		// Log the email send
		await ctx.runMutation(internalTransactionalEmails.logTransactionalEmailSend, {
			email: lead.email,
			emailType: 'welcome_lead',
			messageId: result.messageId,
			metadata: { leadId: args.leadId },
		});

		return { success: true, messageId: result.messageId };
	},
});

/**
 * Send enrollment confirmation email to a student
 *
 * Called after a student is enrolled in a course.
 */
export const sendEnrollmentConfirmation = action({
	args: {
		studentId: v.id('students'),
		courseName: v.string(),
		startDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Get student data
		const student = await ctx.runQuery(internalTransactionalEmails.getStudentForEmail, {
			studentId: args.studentId,
		});

		if (!student) {
			throw new Error('Aluno não encontrado');
		}

		if (!student.email) {
			throw new Error('Aluno não possui email cadastrado');
		}

		const firstName = student.name?.split(' ')[0] || 'Aluno(a)';

		// Build enrollment confirmation HTML
		const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 20px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Matrícula Confirmada! ✅</h1>
  </div>
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Parabéns, ${firstName}!
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Sua matrícula no curso <strong>${args.courseName}</strong> foi confirmada com sucesso!
    </p>
    ${args.startDate ? `<p style="font-size: 16px; line-height: 1.6; color: #333;">📅 <strong>Início das aulas:</strong> ${args.startDate}</p>` : ''}
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px; color: #333;">Próximos passos:</h3>
      <ol style="font-size: 14px; line-height: 1.8; color: #555; margin: 0; padding-left: 20px;">
        <li>Acesse sua área do aluno</li>
        <li>Confira o material do curso</li>
        <li>Prepare-se para as aulas</li>
      </ol>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://portal.grupous.com.br" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
        Acessar Área do Aluno
      </a>
    </div>
    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
      Estamos ansiosos para começar essa jornada com você!<br>
      <strong>Equipe GRUPOUS</strong>
    </p>
  </div>
</body>
</html>`;

		// Send via Brevo SMTP
		const result = await brevoSmtp.sendHtml(
			{ email: student.email, name: student.name || undefined },
			`Matrícula confirmada: ${args.courseName} ✅`,
			htmlContent,
			{ tags: ['enrollment', 'confirmation', 'student'] },
		);

		// Log the email send
		await ctx.runMutation(internalTransactionalEmails.logTransactionalEmailSend, {
			email: student.email,
			emailType: 'enrollment_confirmation',
			messageId: result.messageId,
			metadata: { studentId: args.studentId, courseName: args.courseName },
		});

		return { success: true, messageId: result.messageId };
	},
});

/**
 * Send class reminder email to a student
 *
 * Sends a reminder about an upcoming class.
 */
export const sendClassReminder = action({
	args: {
		studentId: v.id('students'),
		className: v.string(),
		classDate: v.string(),
		classTime: v.string(),
		location: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const student = await ctx.runQuery(internalTransactionalEmails.getStudentForEmail, {
			studentId: args.studentId,
		});

		if (!student?.email) {
			throw new Error('Aluno não encontrado ou sem email');
		}

		const firstName = student.name?.split(' ')[0] || 'Aluno(a)';

		const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Lembrete de Aula 📚</h1>
  </div>
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Olá ${firstName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Não esqueça! Você tem uma aula agendada:
    </p>
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0; color: #333;"><strong>📖 Aula:</strong> ${args.className}</p>
      <p style="margin: 5px 0; color: #333;"><strong>📅 Data:</strong> ${args.classDate}</p>
      <p style="margin: 5px 0; color: #333;"><strong>⏰ Horário:</strong> ${args.classTime}</p>
      ${args.location ? `<p style="margin: 5px 0; color: #333;"><strong>📍 Local:</strong> ${args.location}</p>` : ''}
    </div>
    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
      Nos vemos em breve!<br>
      <strong>Equipe GRUPOUS</strong>
    </p>
  </div>
</body>
</html>`;

		const result = await brevoSmtp.sendHtml(
			{ email: student.email, name: student.name || undefined },
			`Lembrete: ${args.className} em ${args.classDate}`,
			htmlContent,
			{ tags: ['reminder', 'class', 'student'] },
		);

		await ctx.runMutation(internalTransactionalEmails.logTransactionalEmailSend, {
			email: student.email,
			emailType: 'class_reminder',
			messageId: result.messageId,
			metadata: { studentId: args.studentId, className: args.className },
		});

		return { success: true, messageId: result.messageId };
	},
});

/**
 * Send a generic transactional email
 *
 * Flexible action for sending any transactional email with custom content.
 * Use when you need full control over the email content.
 */
export const sendGenericEmail = action({
	args: {
		to: v.object({
			email: v.string(),
			name: v.optional(v.string()),
		}),
		subject: v.string(),
		htmlContent: v.string(),
		tags: v.optional(v.array(v.string())),
		emailType: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const result = await brevoSmtp.sendHtml(args.to, args.subject, args.htmlContent, {
			tags: args.tags,
		});

		await ctx.runMutation(internalTransactionalEmails.logTransactionalEmailSend, {
			email: args.to.email,
			emailType: args.emailType || 'generic',
			messageId: result.messageId,
		});

		return { success: true, messageId: result.messageId };
	},
});

/**
 * Send email using a Brevo template
 *
 * Use this when you have templates configured in Brevo dashboard.
 * Params object should match the template variables.
 */
export const sendTemplateEmail = action({
	args: {
		to: v.object({
			email: v.string(),
			name: v.optional(v.string()),
		}),
		templateId: v.number(),
		params: v.any(),
		tags: v.optional(v.array(v.string())),
		emailType: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const result = await brevoSmtp.sendTemplate(args.templateId, args.to, args.params, {
			tags: args.tags,
		});

		await ctx.runMutation(internalTransactionalEmails.logTransactionalEmailSend, {
			email: args.to.email,
			emailType: args.emailType || `template_${args.templateId}`,
			messageId: result.messageId,
			metadata: { templateId: args.templateId, params: args.params },
		});

		return { success: true, messageId: result.messageId };
	},
});

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = action({
	args: {
		studentId: v.id('students'),
		paymentId: v.id('asaasPayments'),
		paymentValue: v.string(),
		paymentDescription: v.string(),
	},
	handler: async (ctx, args) => {
		const student = await ctx.runQuery(internalTransactionalEmails.getStudentForEmail, {
			studentId: args.studentId,
		});

		if (!student?.email) return { success: false, reason: 'No email' };

		const htmlContent = `
<!DOCTYPE html>
<html>
<body>
  <h1>Pagamento Confirmado! ✅</h1>
  <p>Olá ${student.name?.split(' ')[0] || 'Aluno(a)'},</p>
  <p>Seu pagamento de <strong>${args.paymentValue}</strong> referente a "${args.paymentDescription}" foi confirmado com sucesso.</p>
  <p>Obrigado!</p>
</body>
</html>`;

		const result = await brevoSmtp.sendHtml(
			{ email: student.email, name: student.name || undefined },
			'Pagamento Confirmado ✅',
			htmlContent,
			{ tags: ['payment', 'confirmation'] },
		);

		await ctx.runMutation(internalTransactionalEmails.logTransactionalEmailSend, {
			email: student.email,
			emailType: 'payment_confirmation',
			messageId: result.messageId,
			metadata: { paymentId: args.paymentId },
		});

		return { success: true, messageId: result.messageId };
	},
});

/**
 * Send payment reminder email
 */
export const sendPaymentReminder = action({
	args: {
		studentId: v.id('students'),
		paymentId: v.id('asaasPayments'),
		paymentValue: v.string(),
		dueDate: v.string(),
	},
	handler: async (ctx, args) => {
		const student = await ctx.runQuery(internalTransactionalEmails.getStudentForEmail, {
			studentId: args.studentId,
		});

		if (!student?.email) return { success: false, reason: 'No email' };

		const htmlContent = `
<!DOCTYPE html>
<html>
<body>
  <h1>Lembrete de Pagamento ⏰</h1>
  <p>Olá ${student.name?.split(' ')[0] || 'Aluno(a)'},</p>
  <p>Lembramos que o pagamento de <strong>${args.paymentValue}</strong> vence em <strong>${args.dueDate}</strong>.</p>
  <p>Caso já tenha efetuado o pagamento, desconsidere este aviso.</p>
</body>
</html>`;

		const result = await brevoSmtp.sendHtml(
			{ email: student.email, name: student.name || undefined },
			'Lembrete de Pagamento ⏰',
			htmlContent,
			{ tags: ['payment', 'reminder'] },
		);

		await ctx.runMutation(internalTransactionalEmails.logTransactionalEmailSend, {
			email: student.email,
			emailType: 'payment_reminder',
			messageId: result.messageId,
			metadata: { paymentId: args.paymentId },
		});

		return { success: true, messageId: result.messageId };
	},
});
