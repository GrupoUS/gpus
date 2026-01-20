import { cronJobs, type SchedulableFunctionReference } from 'convex/server';

const apiModule = await import(`./_generated/${'api'}`);
const internalApi = (
	apiModule as unknown as {
		internal: Record<string, Record<string, Record<string, unknown>>>;
	}
).internal;

const runAutoSyncCustomersAction = internalApi.asaas.sync
	.runAutoSyncCustomersAction as SchedulableFunctionReference;
const runAutoSyncPaymentsAction = internalApi.asaas.sync
	.runAutoSyncPaymentsAction as SchedulableFunctionReference;
const checkAndCreateAlerts = internalApi.asaas.alerts
	.checkAndCreateAlerts as SchedulableFunctionReference;
const retryFailedWebhooks = internalApi.asaas.webhooks
	.retryFailedWebhooks as SchedulableFunctionReference;
const processQueuedMessages = internalApi.whatsapp
	.processQueuedMessages as SchedulableFunctionReference;
const sendTaskReminders = internalApi.tasks.crons.sendTaskReminders as SchedulableFunctionReference;
const reactivateIdleLeads = internalApi.tasks.crons
	.reactivateIdleLeads as SchedulableFunctionReference;

const crons = cronJobs();

// Sincronização automática de clientes Asaas a cada hora
crons.interval('asaas-auto-sync-customers', { hours: 1 }, runAutoSyncCustomersAction, {});

// Sincronização automática de pagamentos Asaas a cada 30 minutos
crons.interval('asaas-auto-sync-payments', { minutes: 30 }, runAutoSyncPaymentsAction, {});

// Verificação de alertas a cada 5 minutos
// Checks API health, sync failures, rate limits, webhook issues, and conflicts
crons.interval('asaas-alert-check', { minutes: 5 }, checkAndCreateAlerts, {});

// Retry failed Asaas webhooks every 5 minutes
crons.interval('asaas-webhook-retry', { minutes: 5 }, retryFailedWebhooks, {});

crons.interval('whatsapp-process-queue', { minutes: 1 }, processQueuedMessages, {});

// Task Reminders (Daily 8 AM UTC)
crons.daily('task-reminders', { hourUTC: 8, minuteUTC: 0 }, sendTaskReminders, {});

// Idle Lead Reactivation (Daily 8 AM UTC)
crons.daily('reactivate-idle-leads', { hourUTC: 8, minuteUTC: 0 }, reactivateIdleLeads, {});

export default crons;
