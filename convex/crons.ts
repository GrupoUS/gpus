import { cronJobs } from 'convex/server';

import { internal } from './_generated/api';

const crons = cronJobs();

// Sincronização automática de clientes Asaas a cada hora
crons.interval(
	'asaas-auto-sync-customers',
	{ hours: 1 },
	internal.asaas.sync.runAutoSyncCustomersAction,
	{},
);

// Sincronização automática de pagamentos Asaas a cada 30 minutos
crons.interval(
	'asaas-auto-sync-payments',
	{ minutes: 30 },
	internal.asaas.sync.runAutoSyncPaymentsAction,
	{},
);

// Verificação de alertas a cada 5 minutos
// Checks API health, sync failures, rate limits, webhook issues, and conflicts
crons.interval('asaas-alert-check', { minutes: 5 }, internal.asaas.alerts.checkAndCreateAlerts, {});

// Retry failed Asaas webhooks every 5 minutes
crons.interval(
	'asaas-webhook-retry',
	{ minutes: 5 },
	internal.asaas.webhooks.retryFailedWebhooks,
	{},
);

// Process queued WhatsApp messages every 5 minutes
crons.interval(
	'whatsapp-process-queue',
	{ minutes: 5 },
	// biome-ignore lint/suspicious/noExplicitAny: break deep type recursion on internal
	(internal as any).whatsapp.processQueuedMessages,
	{},
);

export default crons;
