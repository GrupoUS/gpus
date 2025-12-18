import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sincronização automática de clientes Asaas a cada hora
crons.interval(
  "asaas-auto-sync-customers",
  { hours: 1 },
  internal.asaas.sync.runAutoSyncCustomersAction,
  {}
);

export default crons;
