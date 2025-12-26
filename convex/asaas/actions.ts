"use action";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { createAsaasClient, type AsaasClient } from "./client";
import { AsaasConfigurationError } from "./errors";
import { getOrganizationId } from "../lib/auth";

/**
 * Check if a customer already exists in Asaas by CPF or Email
 */
export const checkExistingAsaasCustomer = action({
  args: {
    cpf: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const client = await getAsaasClientFromSettings(ctx);

    // Buscar por CPF
    if (args.cpf) {
      const cleanCpf = args.cpf.replace(/\D/g, "");
      const response = await client.listAllCustomers({
        cpfCnpj: cleanCpf,
        limit: 1,
      });
      if (response.data.length > 0) {
        return { exists: true, customerId: response.data[0].id };
      }
    }

    // Buscar por email
    if (args.email) {
      const response = await client.listAllCustomers({
        email: args.email,
        limit: 1,
      });
      if (response.data.length > 0) {
        return { exists: true, customerId: response.data[0].id };
      }
    }

    return { exists: false };
  },
});

/**
 * Helper to get Asaas client from database settings
 * Falls back to environment variables if database settings not found
 * Uses enhanced client with circuit breaker and retry logic
 */
async function getAsaasClientFromSettings(ctx: any): Promise<AsaasClient> {
  // Try to get settings from database first
  const config: Record<string, any> | null = await ctx.runQuery(
    // @ts-ignore - Deep type instantiation error with Convex internal references
    internal.settings.internalGetIntegrationConfig,
    { integrationName: "asaas" },
  );

  const apiKey = config?.api_key || config?.apiKey || process.env.ASAAS_API_KEY;
  const baseUrl =
    config?.base_url ||
    config?.baseUrl ||
    process.env.ASAAS_BASE_URL ||
    "https://api.asaas.com/v3";

  if (!apiKey) {
    throw new AsaasConfigurationError(
      "ASAAS_API_KEY não configurada. Configure em Configurações > Integrações > Asaas.",
    );
  }

  // Use enhanced client with circuit breaker and retry logic
  return createAsaasClient({ apiKey, baseUrl });
}

export const createAsaasCustomer = action({
  args: {
    studentId: v.id("students"),
    name: v.string(),
    cpfCnpj: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    address: v.optional(v.string()),
    addressNumber: v.optional(v.string()),
    complement: v.optional(v.string()),
    province: v.optional(v.string()),
    externalReference: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    try {
      const client = await getAsaasClientFromSettings(ctx);
      const customer = await client.createCustomer({
        name: args.name,
        cpfCnpj: args.cpfCnpj.replace(/\D/g, ""),
        email: args.email,
        phone: args.phone,
        mobilePhone: args.mobilePhone,
        postalCode: args.postalCode,
        address: args.address,
        addressNumber: args.addressNumber,
        complement: args.complement,
        province: args.province,
        externalReference: args.externalReference,
        notificationDisabled: false,
      });

      // Save Asaas ID to student record
      // @ts-ignore - TypeScript has issues with deep type inference in Convex internal mutations
      await ctx.runMutation(internal.asaas.mutations.updateStudentAsaasId, {
        studentId: args.studentId,
        asaasCustomerId: customer.id,
      });

      // @ts-ignore - audit module types not yet generated
      await ctx.runMutation(internal.asaas.audit.logApiUsage, {
        endpoint: "/customers",
        method: "POST",
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: (await ctx.auth.getUserIdentity())?.subject,
      });

      return customer;
    } catch (error: any) {
      // @ts-ignore - audit module types not yet generated
      await ctx.runMutation(internal.asaas.audit.logApiUsage, {
        endpoint: "/customers",
        method: "POST",
        statusCode: error.response?.status || 500,
        responseTime: Date.now() - startTime,
        userId: (await ctx.auth.getUserIdentity())?.subject,
        errorMessage: error.message,
      });
      console.error(
        "Asaas createCustomer error:",
        error.response?.data || error.message,
      );
      throw new Error(
        `Failed to create Asaas customer: ${JSON.stringify(error.response?.data || error.message)}`,
      );
    }
  },
});

export const createAsaasPayment = action({
  args: {
    studentId: v.id("students"),
    asaasCustomerId: v.string(),
    billingType: v.union(
      v.literal("BOLETO"),
      v.literal("PIX"),
      v.literal("CREDIT_CARD"),
      v.literal("DEBIT_CARD"),
      v.literal("UNDEFINED"),
    ),
    value: v.number(),
    dueDate: v.string(),
    description: v.optional(v.string()),
    installmentCount: v.optional(v.number()),
    installmentValue: v.optional(v.number()),
    externalReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    try {
      const client = await getAsaasClientFromSettings(ctx);
      const payment = await client.createPayment({
        customer: args.asaasCustomerId,
        billingType: args.billingType,
        value: args.value,
        dueDate: args.dueDate,
        description: args.description,
        externalReference: args.externalReference,
        installmentCount: args.installmentCount,
        installmentValue: args.installmentValue,
      });

      // For PIX, fetch QrCode
      let pixData: { encodedImage?: string; payload?: string } = {};
      if (args.billingType === "PIX") {
        try {
          const qrResponse = await client.getPixQrCode(payment.id);
          pixData = {
            encodedImage: qrResponse.encodedImage,
            payload: qrResponse.payload,
          };
        } catch (qrError) {
          console.error("Failed to fetch PIX QrCode", qrError);
        }
      }

      // Save to DB
      await ctx.runMutation(internal.asaas.mutations.createCharge, {
        studentId: args.studentId,
        asaasPaymentId: payment.id,
        asaasCustomerId: payment.customer,
        amount: payment.value,
        dueDate: payment.dueDate,
        billingType: args.billingType,
        description: payment.description,
        installmentCount: args.installmentCount, // Use arg or from payment if available. Avoiding TS error by using arg.
        installmentNumber: payment.installmentNumber,
        boletoUrl: payment.bankSlipUrl ?? undefined,
        pixQrCode: pixData.payload, // Save payload string
      });

      // @ts-ignore - audit module types not yet generated
      await ctx.runMutation(internal.asaas.audit.logApiUsage, {
        endpoint: "/payments",
        method: "POST",
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: (await ctx.auth.getUserIdentity())?.subject,
      });

      return {
        ...payment,
        pixQrCode: pixData.encodedImage,
        pixQrCodePayload: pixData.payload,
      };
    } catch (error: any) {
      // @ts-ignore - audit module types not yet generated
      await ctx.runMutation(internal.asaas.audit.logApiUsage, {
        endpoint: "/payments",
        method: "POST",
        statusCode: error.response?.status || 500,
        responseTime: Date.now() - startTime,
        userId: (await ctx.auth.getUserIdentity())?.subject,
        errorMessage: error.message,
      });
      console.error(
        "Asaas createPayment error:",
        error.response?.data || error.message,
      );
      throw new Error(
        `Failed to create Asaas payment: ${JSON.stringify(error.response?.data || error.message)}`,
      );
    }
  },
});

export const createAsaasSubscription = action({
  args: {
    studentId: v.id("students"),
    asaasCustomerId: v.string(),
    billingType: v.union(
      v.literal("BOLETO"),
      v.literal("PIX"),
      v.literal("CREDIT_CARD"),
    ),
    value: v.number(),
    nextDueDate: v.string(), // YYYY-MM-DD
    cycle: v.union(
      v.literal("WEEKLY"),
      v.literal("BIWEEKLY"),
      v.literal("MONTHLY"),
      v.literal("QUARTERLY"),
      v.literal("SEMIANNUALLY"),
      v.literal("YEARLY"),
    ),
    description: v.optional(v.string()),
    externalReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    try {
      const client = await getAsaasClientFromSettings(ctx);
      const subscription = await client.createSubscription({
        customer: args.asaasCustomerId,
        billingType: args.billingType,
        value: args.value,
        nextDueDate: args.nextDueDate,
        cycle: args.cycle,
        description: args.description,
        externalReference: args.externalReference,
      });

      // @ts-ignore - audit module types not yet generated
      await ctx.runMutation(internal.asaas.audit.logApiUsage, {
        endpoint: "/subscriptions",
        method: "POST",
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: (await ctx.auth.getUserIdentity())?.subject,
      });

      return subscription;
    } catch (error: any) {
      // @ts-ignore - audit module types not yet generated
      await ctx.runMutation(internal.asaas.audit.logApiUsage, {
        endpoint: "/subscriptions",
        method: "POST",
        statusCode: error.response?.status || 500,
        responseTime: Date.now() - startTime,
        userId: (await ctx.auth.getUserIdentity())?.subject,
        errorMessage: error.message,
      });
      console.error(
        "Asaas createSubscription error:",
        error.response?.data || error.message,
      );
      throw new Error(
        `Failed to create Asaas subscription: ${JSON.stringify(error.response?.data || error.message)}`,
      );
    }
  },
});

/**
 * Test Asaas API connection
 * Validates credentials by making a simple API call
 */
export const testAsaasConnection = action({
  args: {},
  handler: async (ctx) => {
    try {
      const client = await getAsaasClientFromSettings(ctx);

      // Make a simple API call to validate credentials
      const response = await client.testConnection();

      return {
        success: true,
        message: "Conexão com Asaas validada com sucesso",
        status: response.status,
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.errors?.[0]?.description ||
        error.message ||
        "Erro desconhecido";
      const statusCode = error.response?.status;

      if (statusCode === 401) {
        return {
          success: false,
          message: "API Key inválida ou expirada",
          error: errorMessage,
        };
      }

      if (statusCode === 404) {
        return {
          success: false,
          message: "URL base inválida ou endpoint não encontrado",
          error: errorMessage,
        };
      }

      return {
        success: false,
        message: "Erro ao conectar com Asaas",
        error: errorMessage,
      };
    }
  },
});

// ═══════════════════════════════════════════════════════
// IMPORT ACTIONS
// ═══════════════════════════════════════════════════════

/**
 * Sync all students as Asaas customers (background job)
 */
export const syncAllStudents = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ synced: number; errors: number; total: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const organizationId = await getOrganizationId(ctx);
    if (!organizationId) {
      throw new Error("Organization ID not found.");
    }

    // @ts-ignore
    const students = (await ctx.runQuery(
      internal.asaas.queries.listAllStudents,
      { organizationId },
    )) as any[];

    let synced = 0;
    let errors = 0;

    for (const student of students) {
      try {
        await ctx.runMutation(
          internal.asaas.mutations.syncStudentAsCustomerInternal,
          {
            studentId: student._id,
          },
        );
        synced++;
      } catch (error) {
        console.error(`Error syncing student ${student._id}:`, error);
        errors++;
      }
    }

    return { synced, errors, total: students.length };
  },
});

/**
 * Import customers from Asaas and create/update students
 * Refactored to use batch processor for concurrent execution with error isolation
 */
export const importCustomersFromAsaas = action({
  args: {
    initiatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await getAsaasClientFromSettings(ctx);
    const MAX_PAGES = 50; // Safety limit: 50 pages * 100 items = 5000 items per run

    // Get organizationId safely
    let organizationId: string | undefined;
    try {
      organizationId = await getOrganizationId(ctx);
    } catch (e) {
      console.warn(
        "Could not determine organizationId in importCustomersFromAsaas",
        e,
      );
    }

    // Create sync log
    // @ts-ignore - TypeScript has issues with deep type inference
    const logId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
      syncType: "customers" as const,
      initiatedBy: args.initiatedBy,
    });

    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let pageCount = 0;

    // Collect all customers from all pages
    const allCustomers: any[] = [];

    try {
      // First pass: Collect all customers (pagination)
      while (hasMore && pageCount < MAX_PAGES) {
        pageCount++;
        const response = await client.listAllCustomers({ offset, limit });
        allCustomers.push(...response.data);
        hasMore = response.hasMore;
        offset += limit;
      }

      // Import batch processor and workers dynamically to avoid circular imports
      const { processBatch } = await import("./batch_processor");
      const { processCustomerWorker } = await import("./import_workers");

      // Create worker function with context and organizationId
      const worker = (customer: any) =>
        processCustomerWorker(ctx, customer, organizationId);

      // Progress callback to update sync log during processing
      const onProgress = async (stats: any) => {
        // @ts-ignore - Deep type instantiation
        await ctx.runMutation(internal.asaas.sync.updateSyncLogProgress, {
          logId,
          recordsProcessed: stats.totalProcessed,
          recordsCreated: stats.created,
          recordsUpdated: stats.updated,
          recordsFailed: stats.failed,
        });
      };

      // Process all customers in concurrent batches
      const result = await processBatch(
        allCustomers,
        worker,
        {
          batchSize: 10, // Process 10 records per batch
          concurrency: 5, // 5 parallel requests per batch
          delayBetweenBatches: 100, // 100ms delay between batches
          maxRetries: 3, // Retry failed records up to 3 times
          checkpointInterval: 50, // Update progress every 50 records
          adaptiveBatching: true, // Adjust batch size based on error rate
        },
        onProgress,
      );

      // Calculate final statistics (created/updated are tracked by batch processor)
      const recordsCreated = result.created || 0;
      const recordsUpdated = result.updated || 0;
      const recordsProcessed = result.totalProcessed;
      const recordsFailed = result.failed.length;

      // Collect error messages
      const errors = result.failed.map((f) => f.error).slice(0, 50);

      // Update sync log as completed
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId,
        status: "completed" as const,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors: errors.length > 0 ? errors : undefined,
        completedAt: Date.now(),
      });

      return {
        success: true,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
      };
    } catch (error: any) {
      // Update sync log as failed
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId,
        status: "failed" as const,
        recordsProcessed: allCustomers.length,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: allCustomers.length,
        errors: [error.message],
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

/**
 * Import payments from Asaas
 * Refactored to use batch processor for concurrent execution with error isolation
 */
export const importPaymentsFromAsaas = action({
  args: {
    initiatedBy: v.string(),
    startDate: v.optional(v.string()), // YYYY-MM-DD
    endDate: v.optional(v.string()), // YYYY-MM-DD
    status: v.optional(v.string()), // PENDING, RECEIVED, etc.
  },
  handler: async (ctx, args) => {
    const client = await getAsaasClientFromSettings(ctx);

    // Get organizationId safely
    let organizationId: string | undefined;
    try {
      organizationId = await getOrganizationId(ctx);
    } catch (e) {
      console.warn(
        "Could not determine organizationId in importPaymentsFromAsaas",
        e,
      );
    }

    // Create sync log
    // @ts-ignore
    const logId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
      syncType: "payments" as const,
      initiatedBy: args.initiatedBy,
      filters: {
        startDate: args.startDate,
        endDate: args.endDate,
        status: args.status,
      },
    });

    let offset = 0;
    const limit = 100;
    const MAX_PAGES = 50; // Safety limit
    let hasMore = true;
    let pageCount = 0;

    // Collect all payments from all pages
    const allPayments: any[] = [];

    try {
      // First pass: Collect all payments (pagination)
      while (hasMore && pageCount < MAX_PAGES) {
        pageCount++;
        const response = await client.listAllPayments({
          dateCreatedGe: args.startDate,
          dateCreatedLe: args.endDate,
          status: args.status,
          offset,
          limit,
        });
        allPayments.push(...response.data);
        hasMore = response.hasMore;
        offset += limit;
      }

      // Import batch processor and workers dynamically
      const { processBatch } = await import("./batch_processor");
      const { processPaymentWorker } = await import("./import_workers");

      // Create worker function with context and organizationId
      const worker = (payment: any) =>
        processPaymentWorker(ctx, payment, organizationId);

      // Progress callback to update sync log during processing
      const onProgress = async (stats: any) => {
        // @ts-ignore - Deep type instantiation
        await ctx.runMutation(internal.asaas.sync.updateSyncLogProgress, {
          logId,
          recordsProcessed: stats.totalProcessed,
          recordsCreated: stats.created,
          recordsUpdated: stats.updated,
          recordsFailed: stats.failed,
        });
      };

      // Process all payments in concurrent batches
      await processBatch(
        allPayments,
        worker,
        {
          batchSize: 10,
          concurrency: 5,
          delayBetweenBatches: 100,
          maxRetries: 3,
          checkpointInterval: 50,
          adaptiveBatching: true,
        },
        onProgress,
      );

      // Recalculate financial metrics after import
      await ctx.runMutation(internal.metrics.calculateFinancialMetrics, {
        organizationId,
      });

      return {
        success: true,
        recordsProcessed: allPayments.length,
        recordsCreated: 0, // Simplified for this call
        recordsUpdated: 0,
        recordsFailed: 0,
      };
    } catch (error: any) {
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId,
        status: "failed" as const,
        recordsProcessed: allPayments.length,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: allPayments.length,
        errors: [error.message],
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

/**
 * Import subscriptions from Asaas
 * Refactored to use batch processor for concurrent execution with error isolation
 */
export const importSubscriptionsFromAsaas = action({
  args: {
    initiatedBy: v.string(),
    status: v.optional(
      v.union(v.literal("ACTIVE"), v.literal("INACTIVE"), v.literal("EXPIRED")),
    ),
  },
  handler: async (ctx, args) => {
    const client = await getAsaasClientFromSettings(ctx);

    // Get organizationId safely
    let organizationId: string | undefined;
    try {
      organizationId = await getOrganizationId(ctx);
    } catch (e) {
      console.warn(
        "Could not determine organizationId in importSubscriptionsFromAsaas",
        e,
      );
    }

    // Create sync log
    // @ts-ignore
    const logId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
      syncType: "subscriptions" as const,
      initiatedBy: args.initiatedBy,
      filters: {
        status: args.status,
      },
    });

    let offset = 0;
    const limit = 100;
    const MAX_PAGES = 50; // Safety limit
    let hasMore = true;
    let pageCount = 0;

    // Collect all subscriptions from all pages
    const allSubscriptions: any[] = [];

    try {
      // First pass: Collect all subscriptions (pagination)
      while (hasMore && pageCount < MAX_PAGES) {
        pageCount++;
        const response = await client.listAllSubscriptions({
          status: args.status,
          offset,
          limit,
        });
        allSubscriptions.push(...response.data);
        hasMore = response.hasMore;
        offset += limit;
      }

      // Import batch processor and workers dynamically
      const { processBatch } = await import("./batch_processor");
      const { processSubscriptionWorker } = await import("./import_workers");

      // Create worker function with context and organizationId
      const worker = (subscription: any) =>
        processSubscriptionWorker(ctx, subscription, organizationId);

      // Progress callback to update sync log during processing
      const onProgress = async (stats: any) => {
        // @ts-ignore - Deep type instantiation
        await ctx.runMutation(internal.asaas.sync.updateSyncLogProgress, {
          logId,
          recordsProcessed: stats.totalProcessed,
          recordsCreated: stats.created,
          recordsUpdated: stats.updated,
          recordsFailed: stats.failed,
        });
      };

      // Process all subscriptions in concurrent batches
      const result = await processBatch(
        allSubscriptions,
        worker,
        {
          batchSize: 10,
          concurrency: 5,
          delayBetweenBatches: 100,
          maxRetries: 3,
          checkpointInterval: 50,
          adaptiveBatching: true,
        },
        onProgress,
      );

      // Calculate final statistics
      const recordsCreated = result.created || 0;
      const recordsUpdated = result.updated || 0;
      const recordsProcessed = result.totalProcessed;
      const recordsFailed = result.failed.length;

      // Collect error messages
      const errors = result.failed.map((f) => f.error).slice(0, 50);

      // Update sync log as completed
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId,
        status: "completed" as const,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors: errors.length > 0 ? errors : undefined,
        completedAt: Date.now(),
      });

      return {
        success: true,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
      };
    } catch (error: any) {
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId,
        status: "failed" as const,
        recordsProcessed: allSubscriptions.length,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: allSubscriptions.length,
        errors: [error.message],
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

/**
 * Sync financial data from Asaas (get summary metrics)
 */
export const syncFinancialDataFromAsaas = action({
  args: {
    initiatedBy: v.string(),
    startDate: v.optional(v.string()), // YYYY-MM-DD
    endDate: v.optional(v.string()), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const client = await getAsaasClientFromSettings(ctx);

    // Create sync log
    // @ts-ignore
    const logId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
      syncType: "financial" as const,
      initiatedBy: args.initiatedBy,
      filters: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
    });

    try {
      // Get financial summary from Asaas
      const summary = await client.getFinancialSummary({
        startDate: args.startDate,
        endDate: args.endDate,
      });

      // Update sync log as completed
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId,
        status: "completed" as const,
        recordsProcessed: summary.paymentsCount,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        completedAt: Date.now(),
      });

      return {
        success: true,
        summary,
      };
    } catch (error: any) {
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId,
        status: "failed" as const,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        errors: [error.message],
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

// Type for import results
interface ImportResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
}

interface CombinedImportResult {
  success: boolean;
  customers: ImportResult | null;
  payments: ImportResult | null;
  subscriptions: ImportResult | null; // Added
}

/**
 * Import customers AND payments from Asaas (combined operation)
 * NOTE: This action implements the logic directly instead of calling other actions,
 * because Convex doesn't support ctx.runAction() calls to public actions from within actions.
 */
export const importAllFromAsaas = action({
  args: {
    initiatedBy: v.string(),
  },
  handler: async (ctx, args): Promise<CombinedImportResult> => {
    console.log("[importAllFromAsaas] Starting batch import...");

    // CRITICAL: Require authentication before importing
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.error("[importAllFromAsaas] No authenticated user");
      throw new Error(
        "Você precisa estar logado para importar dados do Asaas.",
      );
    }
    console.log("[importAllFromAsaas] User authenticated:", identity.subject);

    let client: AsaasClient;
    try {
      client = await getAsaasClientFromSettings(ctx);
      console.log("[importAllFromAsaas] Asaas client initialized successfully");
    } catch (error: any) {
      console.error(
        "[importAllFromAsaas] Failed to initialize Asaas client:",
        error.message,
      );
      throw new Error(
        `Falha ao conectar com Asaas: ${error.message}. Verifique se a API Key está configurada em Configurações > Integrações.`,
      );
    }

    // Get organizationId - REQUIRED for multi-tenant data isolation
    let organizationId: string;
    try {
      organizationId = await getOrganizationId(ctx);
      console.log("[importAllFromAsaas] Organization ID:", organizationId);
    } catch (e: any) {
      console.error(
        "[importAllFromAsaas] Failed to get organizationId:",
        e.message,
      );
      throw new Error(
        "Não foi possível determinar sua organização. Por favor, faça logout e login novamente.",
      );
    }

    if (!organizationId) {
      throw new Error("Organization ID é obrigatório para importação.");
    }

    // Import batch processor and workers dynamically to avoid circular dependencies
    const { processBatch } = await import("./batch_processor");
    const {
      processCustomerWorker,
      processPaymentWorker,
      processSubscriptionWorker,
    } = await import("./import_workers");

    const BATCH_CONFIG = {
      batchSize: 10,
      concurrency: 5,
      delayBetweenBatches: 100,
      maxRetries: 3,
      checkpointInterval: 50,
      adaptiveBatching: true,
    };

    // ═══════════════════════════════════════════════════════
    // STEP 1: IMPORT CUSTOMERS (BATCH PROCESSING)
    // ═══════════════════════════════════════════════════════
    console.log("[importAllFromAsaas] Step 1: Batch importing customers...");

    let customersLogId;
    try {
      customersLogId = await ctx.runMutation(
        internal.asaas.sync.createSyncLog,
        {
          syncType: "customers" as const,
          initiatedBy: args.initiatedBy,
        },
      );
    } catch (error: any) {
      throw new Error(`Falha ao criar log de sincronização: ${error.message}`);
    }

    // Collect all customers from all pages first
    const allCustomers: any[] = [];
    let customersOffset = 0;
    const limit = 100;
    let customersHasMore = true;
    const MAX_PAGES = 50;
    let customersPageCount = 0;

    while (customersHasMore && customersPageCount < MAX_PAGES) {
      customersPageCount++;
      console.log(
        `[importAllFromAsaas] Fetching customers page ${customersPageCount}...`,
      );
      const response = await client.listAllCustomers({
        offset: customersOffset,
        limit,
      });
      allCustomers.push(...response.data);
      customersHasMore = response.hasMore;
      customersOffset += limit;
    }
    console.log(
      `[importAllFromAsaas] Collected ${allCustomers.length} customers for batch processing`,
    );

    // Batch process customers
    const customerWorker = (customer: any) =>
      processCustomerWorker(ctx, customer, organizationId);

    const customersProgress = async (stats: any) => {
      await ctx.runMutation(internal.asaas.sync.updateSyncLogProgress, {
        logId: customersLogId,
        recordsProcessed: stats.totalProcessed,
        recordsCreated: stats.created,
        recordsUpdated: stats.updated,
        recordsFailed: stats.failed.length,
      });
    };

    const customersBatchResult = await processBatch(
      allCustomers,
      customerWorker,
      BATCH_CONFIG,
      customersProgress,
    );

    // Update sync log with final results
    await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
      logId: customersLogId,
      status: "completed" as const,
      recordsProcessed: customersBatchResult.totalProcessed,
      recordsCreated: customersBatchResult.created || 0,
      recordsUpdated: customersBatchResult.updated || 0,
      recordsFailed: customersBatchResult.failed.length,
      errors: customersBatchResult.failed.slice(0, 50).map((f) => f.error),
      completedAt: Date.now(),
    });

    const customersResult: ImportResult = {
      success: customersBatchResult.failed.length < allCustomers.length,
      recordsProcessed: customersBatchResult.totalProcessed,
      recordsCreated: customersBatchResult.created || 0,
      recordsUpdated: customersBatchResult.updated || 0,
      recordsFailed: customersBatchResult.failed.length,
    };

    // If customers import failed completely, don't proceed with payments
    if (
      customersBatchResult.totalProcessed === 0 ||
      customersBatchResult.failed.length === allCustomers.length
    ) {
      return {
        success: false,
        customers: customersResult,
        payments: null,
        subscriptions: null,
      };
    }

    // ═══════════════════════════════════════════════════════
    // STEP 2: IMPORT PAYMENTS (BATCH PROCESSING)
    // ═══════════════════════════════════════════════════════
    console.log("[importAllFromAsaas] Step 2: Batch importing payments...");

    const paymentsLogId = await ctx.runMutation(
      internal.asaas.sync.createSyncLog,
      {
        syncType: "payments" as const,
        initiatedBy: args.initiatedBy,
      },
    );

    // Collect all payments from all pages first
    const allPayments: any[] = [];
    let paymentsOffset = 0;
    let paymentsHasMore = true;
    let paymentsPageCount = 0;

    while (paymentsHasMore && paymentsPageCount < MAX_PAGES) {
      paymentsPageCount++;
      const response = await client.listAllPayments({
        offset: paymentsOffset,
        limit,
      });
      allPayments.push(...response.data);
      paymentsHasMore = response.hasMore;
      paymentsOffset += limit;
    }
    console.log(
      `[importAllFromAsaas] Collected ${allPayments.length} payments for batch processing`,
    );

    // Batch process payments
    const paymentWorker = (payment: any) =>
      processPaymentWorker(ctx, payment, organizationId);

    const paymentsProgress = async (stats: any) => {
      await ctx.runMutation(internal.asaas.sync.updateSyncLogProgress, {
        logId: paymentsLogId,
        recordsProcessed: stats.totalProcessed,
        recordsCreated: stats.created,
        recordsUpdated: stats.updated,
        recordsFailed: stats.failed.length,
      });
    };

    const paymentsBatchResult = await processBatch(
      allPayments,
      paymentWorker,
      BATCH_CONFIG,
      paymentsProgress,
    );

    // Update sync log with final results
    await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
      logId: paymentsLogId,
      status: "completed" as const,
      recordsProcessed: paymentsBatchResult.totalProcessed,
      recordsCreated: paymentsBatchResult.created || 0,
      recordsUpdated: paymentsBatchResult.updated || 0,
      recordsFailed: paymentsBatchResult.failed.length,
      errors: paymentsBatchResult.failed.slice(0, 50).map((f) => f.error),
      completedAt: Date.now(),
    });

    const paymentsResult: ImportResult = {
      success: paymentsBatchResult.failed.length < allPayments.length,
      recordsProcessed: paymentsBatchResult.totalProcessed,
      recordsCreated: paymentsBatchResult.created || 0,
      recordsUpdated: paymentsBatchResult.updated || 0,
      recordsFailed: paymentsBatchResult.failed.length,
    };

    // ═══════════════════════════════════════════════════════
    // STEP 3: IMPORT SUBSCRIPTIONS (BATCH PROCESSING)
    // ═══════════════════════════════════════════════════════
    console.log(
      "[importAllFromAsaas] Step 3: Batch importing subscriptions...",
    );

    const subscriptionsLogId = await ctx.runMutation(
      internal.asaas.sync.createSyncLog,
      {
        syncType: "subscriptions" as const,
        initiatedBy: args.initiatedBy,
      },
    );

    // Collect all subscriptions from all pages first
    const allSubscriptions: any[] = [];
    let subscriptionsOffset = 0;
    let subscriptionsHasMore = true;
    let subscriptionsPageCount = 0;

    while (subscriptionsHasMore && subscriptionsPageCount < MAX_PAGES) {
      subscriptionsPageCount++;
      const response = await client.listAllSubscriptions({
        offset: subscriptionsOffset,
        limit,
      });
      allSubscriptions.push(...response.data);
      subscriptionsHasMore = response.hasMore;
      subscriptionsOffset += limit;
    }
    console.log(
      `[importAllFromAsaas] Collected ${allSubscriptions.length} subscriptions for batch processing`,
    );

    // Batch process subscriptions
    const subscriptionWorker = (subscription: any) =>
      processSubscriptionWorker(ctx, subscription, organizationId);

    const subscriptionsProgress = async (stats: any) => {
      await ctx.runMutation(internal.asaas.sync.updateSyncLogProgress, {
        logId: subscriptionsLogId,
        recordsProcessed: stats.totalProcessed,
        recordsCreated: stats.created,
        recordsUpdated: stats.updated,
        recordsFailed: stats.failed.length,
      });
    };

    const subscriptionsBatchResult = await processBatch(
      allSubscriptions,
      subscriptionWorker,
      BATCH_CONFIG,
      subscriptionsProgress,
    );

    // Update sync log with final results
    await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
      logId: subscriptionsLogId,
      status: "completed" as const,
      recordsProcessed: subscriptionsBatchResult.totalProcessed,
      recordsCreated: subscriptionsBatchResult.created || 0,
      recordsUpdated: subscriptionsBatchResult.updated || 0,
      recordsFailed: subscriptionsBatchResult.failed.length,
      errors: subscriptionsBatchResult.failed.slice(0, 50).map((f) => f.error),
      completedAt: Date.now(),
    });

    const subscriptionsResult: ImportResult = {
      success: subscriptionsBatchResult.failed.length < allSubscriptions.length,
      recordsProcessed: subscriptionsBatchResult.totalProcessed,
      recordsCreated: subscriptionsBatchResult.created || 0,
      recordsUpdated: subscriptionsBatchResult.updated || 0,
      recordsFailed: subscriptionsBatchResult.failed.length,
    };

    console.log("[importAllFromAsaas] Batch import completed");

    return {
      success:
        customersResult.success &&
        paymentsResult.success &&
        subscriptionsResult.success,
      customers: customersResult,
      payments: paymentsResult,
      subscriptions: subscriptionsResult,
    };
  },
});
