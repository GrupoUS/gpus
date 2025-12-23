import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sincronização automática de clientes Asaas a cada hora
// @ts-ignore - Deep type instantiation workaround
crons.interval(
  "asaas-auto-sync-customers",
  { hours: 1 },
  internal.asaas.sync.runAutoSyncCustomersAction,
  {}
);

// Sincronização automática de pagamentos Asaas a cada 30 minutos
// @ts-ignore - Deep type instantiation workaround
crons.interval(
  "asaas-auto-sync-payments",
  { minutes: 30 },
  internal.asaas.sync.runAutoSyncPaymentsAction,
  {}
);

export default crons;

