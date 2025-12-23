"use action";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { createAsaasClient, type AsaasClient, dateStringToTimestamp } from "../lib/asaas";
import { getOrganizationId } from "../lib/auth";

/**
 * Helper to get Asaas client from database settings
 * Falls back to environment variables if database settings not found
 */
async function getAsaasClientFromSettings(ctx: any): Promise<AsaasClient> {
  // Try to get settings from database first
  // @ts-ignore - Deep type instantiation error
  const config = await ctx.runQuery((internal as any).settings.internalGetIntegrationConfig, {
    integrationName: "asaas",
  });

  const apiKey = config?.api_key || config?.apiKey || process.env.ASAAS_API_KEY;
  const baseUrl = config?.base_url || config?.baseUrl || process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3";

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada. Configure em Configurações > Integrações > Asaas.");
  }

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

      return customer;
    } catch (error: any) {
      console.error("Asaas createCustomer error:", error.response?.data || error.message);
      throw new Error(`Failed to create Asaas customer: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  },
});

export const createAsaasPayment = action({
  args: {
    studentId: v.id("students"),
    asaasCustomerId: v.string(),
    billingType: v.union(v.literal("BOLETO"), v.literal("PIX"), v.literal("CREDIT_CARD"), v.literal("DEBIT_CARD"), v.literal("UNDEFINED")),
    value: v.number(),
    dueDate: v.string(),
    description: v.optional(v.string()),
    installmentCount: v.optional(v.number()),
    installmentValue: v.optional(v.number()),
    externalReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
      let pixData: { encodedImage?: string, payload?: string } = {};
      if (args.billingType === "PIX") {
         try {
             const qrResponse = await client.getPixQrCode(payment.id);
             pixData = { encodedImage: qrResponse.encodedImage, payload: qrResponse.payload };
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
        boletoUrl: payment.bankSlipUrl,
        pixQrCode: pixData.payload, // Save payload string
      });

      return { ...payment, pixQrCode: pixData.encodedImage, pixQrCodePayload: pixData.payload };
    } catch (error: any) {
      console.error("Asaas createPayment error:", error.response?.data || error.message);
      throw new Error(`Failed to create Asaas payment: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  },
});

export const createAsaasSubscription = action({
  args: {
    studentId: v.id("students"),
    asaasCustomerId: v.string(),
    billingType: v.union(v.literal("BOLETO"), v.literal("PIX"), v.literal("CREDIT_CARD")),
    value: v.number(),
    nextDueDate: v.string(), // YYYY-MM-DD
    cycle: v.union(v.literal("WEEKLY"), v.literal("BIWEEKLY"), v.literal("MONTHLY"), v.literal("QUARTERLY"), v.literal("SEMIANNUALLY"), v.literal("YEARLY")),
    description: v.optional(v.string()),
    externalReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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

      return subscription;
    } catch (error: any) {
      console.error("Asaas createSubscription error:", error.response?.data || error.message);
      throw new Error(`Failed to create Asaas subscription: ${JSON.stringify(error.response?.data || error.message)}`);
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
      const errorMessage = error.response?.data?.errors?.[0]?.description || error.message || "Erro desconhecido";
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
	handler: async (ctx): Promise<{ synced: number; errors: number; total: number }> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error('Unauthenticated')
		}

    const organizationId = await getOrganizationId(ctx);
    if (!organizationId) {
      throw new Error("Organization ID not found.");
    }

		// @ts-ignore
		const students = await ctx.runQuery(internal.asaas.queries.listAllStudents, { organizationId }) as any[]

		let synced = 0
		let errors = 0

		for (const student of students) {
			try {
				await ctx.runMutation(internal.asaas.mutations.syncStudentAsCustomerInternal, {
					studentId: student._id,
				})
				synced++
			} catch (error) {
				console.error(`Error syncing student ${student._id}:`, error)
				errors++
			}
		}

		return { synced, errors, total: students.length }
	},
})

/**
 * Import customers from Asaas and create/update students
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
        console.warn('Could not determine organizationId in importCustomersFromAsaas', e);
    }

    // Create sync log
    // @ts-ignore - TypeScript has issues with deep type inference
    const logId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
      syncType: 'customers' as const,
      initiatedBy: args.initiatedBy,
    });

    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    let pageCount = 0;

    try {
      while (hasMore && pageCount < MAX_PAGES) {
        pageCount++;
        const response = await client.listAllCustomers({ offset, limit });

        for (const customer of response.data) {
          recordsProcessed++;
          try {
            // Check if student exists with this asaasCustomerId
            // @ts-ignore
            let existingStudent = await ctx.runQuery(internal.asaas.mutations.getStudentByAsaasId, {
              asaasCustomerId: customer.id,
            });

            // Deduplication Logic: If not found by ID, try to find by Email or CPF
            if (!existingStudent) {
              // @ts-ignore
              const duplicate = await ctx.runQuery(internal.asaas.mutations.getStudentByEmailOrCpf, {
                email: customer.email,
                cpf: customer.cpfCnpj
              });

              if (duplicate) {
               console.log(`Matched existing student ${duplicate._id} by Email/CPF. Linking Asaas ID ${customer.id}`);
               // Link the found student to this Asaas Customer ID
               // @ts-ignore
               await ctx.runMutation(internal.asaas.mutations.updateStudentAsaasId, {
                 studentId: duplicate._id,
                 asaasCustomerId: customer.id,
               });

               // Use this student for further updates
               existingStudent = duplicate;
              }
            }

            if (existingStudent) {
              // Update existing student
              // @ts-ignore
              await ctx.runMutation(internal.asaas.mutations.updateStudentFromAsaas, {
                studentId: existingStudent._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone || customer.mobilePhone,
                cpf: customer.cpfCnpj,
              });
              recordsUpdated++;
            } else {
              // Create new student
              // @ts-ignore
              await ctx.runMutation(internal.asaas.mutations.createStudentFromAsaas, {
                name: customer.name,
                email: customer.email,
                phone: customer.phone || customer.mobilePhone || '',
                cpf: customer.cpfCnpj,
                asaasCustomerId: customer.id,
                organizationId,
              });
              recordsCreated++;
            }
          } catch (err: any) {
            recordsFailed++;
            errors.push(`Customer ${customer.id}: ${err.message}`);
          }
        }

        hasMore = response.hasMore;
        offset += limit;
      }

      // Update sync log as completed
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId,
        status: 'completed' as const,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors: errors.length > 0 ? errors.slice(0, 50) : undefined,
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
        status: 'failed' as const,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors: [error.message, ...errors].slice(0, 50),
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

/**
 * Import payments from Asaas
 */
export const importPaymentsFromAsaas = action({
  args: {
    initiatedBy: v.string(),
    startDate: v.optional(v.string()), // YYYY-MM-DD
    endDate: v.optional(v.string()),   // YYYY-MM-DD
    status: v.optional(v.string()),    // PENDING, RECEIVED, etc.
  },
  handler: async (ctx, args) => {
    const client = await getAsaasClientFromSettings(ctx);

    // Get organizationId safely
    let organizationId: string | undefined;
    try {
        organizationId = await getOrganizationId(ctx);
    } catch (e) {
        console.warn('Could not determine organizationId in importPaymentsFromAsaas', e);
    }

    // Create sync log
    // @ts-ignore
    const logId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
      syncType: 'payments' as const,
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
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];
    let pageCount = 0;

    try {
      while (hasMore && pageCount < MAX_PAGES) {
        pageCount++;
        const response = await client.listAllPayments({
          dateCreatedGe: args.startDate,
          dateCreatedLe: args.endDate,
          status: args.status,
          offset,
          limit,
        });

        for (const payment of response.data) {
          recordsProcessed++;
          try {
            // Check if payment exists
            // @ts-ignore
            const existingPayment = await ctx.runQuery(internal.asaas.mutations.getPaymentByAsaasId, {
              asaasPaymentId: payment.id,
            });

            if (existingPayment) {
              // Update existing payment
              // @ts-ignore
              await ctx.runMutation(internal.asaas.mutations.updatePaymentFromAsaas, {
                paymentId: existingPayment._id,
                status: payment.status,
                netValue: payment.netValue,
                confirmedDate: payment.paymentDate ? new Date(payment.paymentDate).getTime() : undefined,
              });
              recordsUpdated++;
            } else {
              // Try to find student by asaasCustomerId
              // @ts-ignore
              const student = await ctx.runQuery(internal.asaas.mutations.getStudentByAsaasId, {
                asaasCustomerId: payment.customer,
              });

              if (student) {
                // Create new payment record
                // @ts-ignore
                await ctx.runMutation(internal.asaas.mutations.createPaymentFromAsaas, {
                  studentId: student._id,
                  asaasPaymentId: payment.id,
                  asaasCustomerId: payment.customer,
                  value: payment.value,
                  netValue: payment.netValue,
                  status: payment.status,
                  dueDate: new Date(payment.dueDate).getTime(),
                  billingType: payment.billingType,
                  description: payment.description,
                  boletoUrl: payment.bankSlipUrl,
                  confirmedDate: payment.paymentDate ? new Date(payment.paymentDate).getTime() : undefined,
                  organizationId,
                });
                recordsCreated++;
              } else {
                // Student not found, skip but log
                errors.push(`Payment ${payment.id}: Student not found for customer ${payment.customer}`);
                recordsFailed++;
              }
            }
          } catch (err: any) {
            recordsFailed++;
            errors.push(`Payment ${payment.id}: ${err.message}`);
          }
        }

        hasMore = response.hasMore;
        offset += limit;
      }

      // Update sync log as completed
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId,
        status: 'completed' as const,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors: errors.length > 0 ? errors.slice(0, 50) : undefined,
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
        status: 'failed' as const,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors: [error.message, ...errors].slice(0, 50),
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

/**
 * Import subscriptions from Asaas
 */
export const importSubscriptionsFromAsaas = action({
  args: {
    initiatedBy: v.string(),
    status: v.optional(v.union(
      v.literal('ACTIVE'),
      v.literal('INACTIVE'),
      v.literal('EXPIRED')
    )),
  },
  handler: async (ctx, args) => {
    const client = await getAsaasClientFromSettings(ctx);

    // Get organizationId safely
    let organizationId: string | undefined;
    try {
        organizationId = await getOrganizationId(ctx);
    } catch (e) {
        console.warn('Could not determine organizationId in importSubscriptionsFromAsaas', e);
    }

    // Create sync log
    // @ts-ignore
    const logId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
      syncType: 'subscriptions' as const,
      initiatedBy: args.initiatedBy,
      filters: {
        status: args.status,
      },
    });

    let offset = 0;
    const limit = 100;
    const MAX_PAGES = 50; // Safety limit
    let hasMore = true;
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];
    let pageCount = 0;

    try {
      while (hasMore && pageCount < MAX_PAGES) {
        pageCount++;
        const response = await client.listAllSubscriptions({
          status: args.status,
          offset,
          limit,
        });

        for (const subscription of response.data) {
          recordsProcessed++;
          try {
            // Check if subscription exists
            // @ts-ignore
            const existingSubscription = await ctx.runQuery(internal.asaas.mutations.getSubscriptionByAsaasId, {
              asaasSubscriptionId: subscription.id,
            });

            if (existingSubscription) {
              // Update existing subscription
              // @ts-ignore
              await ctx.runMutation(internal.asaas.mutations.updateSubscriptionFromAsaas, {
                subscriptionId: existingSubscription._id,
                status: subscription.status,
                value: subscription.value,
                nextDueDate: new Date(subscription.nextDueDate).getTime(),
              });
              recordsUpdated++;
            } else {
              // Try to find student by asaasCustomerId
              // @ts-ignore
              const student = await ctx.runQuery(internal.asaas.mutations.getStudentByAsaasId, {
                asaasCustomerId: subscription.customer,
              });

              if (student) {
                // Create new subscription record
                // @ts-ignore
                await ctx.runMutation(internal.asaas.mutations.createSubscriptionFromAsaas, {
                  studentId: student._id,
                  asaasSubscriptionId: subscription.id,
                  asaasCustomerId: subscription.customer,
                  value: subscription.value,
                  cycle: subscription.cycle,
                  status: subscription.status,
                  nextDueDate: new Date(subscription.nextDueDate).getTime(),
                  organizationId,
                });
                recordsCreated++;
              } else {
                errors.push(`Subscription ${subscription.id}: Student not found for customer ${subscription.customer}`);
                recordsFailed++;
              }
            }
          } catch (err: any) {
            recordsFailed++;
            errors.push(`Subscription ${subscription.id}: ${err.message}`);
          }
        }

        hasMore = response.hasMore;
        offset += limit;
      }

      // Update sync log as completed
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId,
        status: 'completed' as const,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors: errors.length > 0 ? errors.slice(0, 50) : undefined,
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
        status: 'failed' as const,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors: [error.message, ...errors].slice(0, 50),
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
    endDate: v.optional(v.string()),   // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const client = await getAsaasClientFromSettings(ctx);

    // Create sync log
    // @ts-ignore
    const logId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
      syncType: 'financial' as const,
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
        status: 'completed' as const,
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
        status: 'failed' as const,
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
    console.log('[importAllFromAsaas] Starting import...');

    // CRITICAL: Require authentication before importing
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.error('[importAllFromAsaas] No authenticated user');
      throw new Error('Você precisa estar logado para importar dados do Asaas.');
    }
    console.log('[importAllFromAsaas] User authenticated:', identity.subject);

    let client: AsaasClient;
    try {
      client = await getAsaasClientFromSettings(ctx);
      console.log('[importAllFromAsaas] Asaas client initialized successfully');
    } catch (error: any) {
      console.error('[importAllFromAsaas] Failed to initialize Asaas client:', error.message);
      throw new Error(`Falha ao conectar com Asaas: ${error.message}. Verifique se a API Key está configurada em Configurações > Integrações.`);
    }

    const MAX_PAGES = 50;

    // Get organizationId - REQUIRED for multi-tenant data isolation
    let organizationId: string;
    try {
      organizationId = await getOrganizationId(ctx);
      console.log('[importAllFromAsaas] Organization ID:', organizationId);
    } catch (e: any) {
      console.error('[importAllFromAsaas] Failed to get organizationId:', e.message);
      throw new Error('Não foi possível determinar sua organização. Por favor, faça logout e login novamente.');
    }

    if (!organizationId) {
      throw new Error('Organization ID é obrigatório para importação.');
    }

    // ═══════════════════════════════════════════════════════
    // STEP 1: IMPORT CUSTOMERS
    // ═══════════════════════════════════════════════════════
    console.log('[importAllFromAsaas] Step 1: Creating customers sync log...');

    let customersLogId;
    try {
      // @ts-ignore
      customersLogId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
        syncType: 'customers' as const,
        initiatedBy: args.initiatedBy,
      });
      console.log('[importAllFromAsaas] Customers sync log created:', customersLogId);
    } catch (error: any) {
      console.error('[importAllFromAsaas] Failed to create customers sync log:', error.message);
      throw new Error(`Falha ao criar log de sincronização: ${error.message}`);
    }

    let customersOffset = 0;
    const limit = 100;
    let customersHasMore = true;
    let customersProcessed = 0;
    let customersCreated = 0;
    let customersUpdated = 0;
    let customersFailed = 0;
    const customersErrors: string[] = [];
    let customersPageCount = 0;
    let customersSuccess = true;

    try {
      while (customersHasMore && customersPageCount < MAX_PAGES) {
        customersPageCount++;
        console.log(`[importAllFromAsaas] Fetching customers page ${customersPageCount}...`);

        let response;
        try {
          response = await client.listAllCustomers({ offset: customersOffset, limit });
          console.log(`[importAllFromAsaas] Got ${response.data.length} customers, hasMore: ${response.hasMore}`);
        } catch (apiError: any) {
          console.error(`[importAllFromAsaas] API error fetching customers:`, apiError.message);
          throw apiError;
        }

        for (const customer of response.data) {
          customersProcessed++;
          try {
            // Check if student exists with this asaasCustomerId
            // @ts-ignore
            let existingStudent = await ctx.runQuery(internal.asaas.mutations.getStudentByAsaasId, {
              asaasCustomerId: customer.id,
            });

            // Deduplication Logic: If not found by ID, try to find by Email or CPF
            if (!existingStudent) {
              // @ts-ignore
              const duplicate = await ctx.runQuery(internal.asaas.mutations.getStudentByEmailOrCpf, {
                email: customer.email,
                cpf: customer.cpfCnpj
              });

              if (duplicate) {
                // @ts-ignore
                await ctx.runMutation(internal.asaas.mutations.updateStudentAsaasId, {
                  studentId: duplicate._id,
                  asaasCustomerId: customer.id,
                });
                existingStudent = duplicate;
              }
            }

            if (existingStudent) {
              // @ts-ignore
              await ctx.runMutation(internal.asaas.mutations.updateStudentFromAsaas, {
                studentId: existingStudent._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone || customer.mobilePhone,
                cpf: customer.cpfCnpj,
              });
              customersUpdated++;
            } else {
              // @ts-ignore
              await ctx.runMutation(internal.asaas.mutations.createStudentFromAsaas, {
                name: customer.name,
                email: customer.email,
                phone: customer.phone || customer.mobilePhone || '',
                cpf: customer.cpfCnpj,
                asaasCustomerId: customer.id,
                organizationId,
              });
              customersCreated++;
            }
          } catch (err: any) {
            customersFailed++;
            customersErrors.push(`Customer ${customer.id}: ${err.message}`);
          }
        }

        customersHasMore = response.hasMore;
        customersOffset += limit;
      }

      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId: customersLogId,
        status: 'completed' as const,
        recordsProcessed: customersProcessed,
        recordsCreated: customersCreated,
        recordsUpdated: customersUpdated,
        recordsFailed: customersFailed,
        errors: customersErrors.length > 0 ? customersErrors.slice(0, 50) : undefined,
        completedAt: Date.now(),
      });
    } catch (error: any) {
      customersSuccess = false;
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId: customersLogId,
        status: 'failed' as const,
        recordsProcessed: customersProcessed,
        recordsCreated: customersCreated,
        recordsUpdated: customersUpdated,
        recordsFailed: customersFailed,
        errors: [error.message, ...customersErrors].slice(0, 50),
        completedAt: Date.now(),
      });
    }

    const customersResult: ImportResult = {
      success: customersSuccess,
      recordsProcessed: customersProcessed,
      recordsCreated: customersCreated,
      recordsUpdated: customersUpdated,
      recordsFailed: customersFailed,
    };

    // If customers import failed completely, don't proceed with payments
    if (!customersSuccess) {
      return {
        success: false,
        customers: customersResult,
        payments: null,
        subscriptions: null,
      };
    }

    // ═══════════════════════════════════════════════════════
    // STEP 2: IMPORT PAYMENTS
    // ═══════════════════════════════════════════════════════

    // @ts-ignore
    const paymentsLogId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
      syncType: 'payments' as const,
      initiatedBy: args.initiatedBy,
    });

    let paymentsOffset = 0;
    let paymentsHasMore = true;
    let paymentsProcessed = 0;
    let paymentsCreated = 0;
    let paymentsUpdated = 0;
    let paymentsFailed = 0;
    const paymentsErrors: string[] = [];
    let paymentsPageCount = 0;
    let paymentsSuccess = true;

    try {
      while (paymentsHasMore && paymentsPageCount < MAX_PAGES) {
        paymentsPageCount++;
        const response = await client.listAllPayments({ offset: paymentsOffset, limit });

        for (const payment of response.data) {
          paymentsProcessed++;
          try {
            // @ts-ignore
            const existingPayment = await ctx.runQuery(internal.asaas.mutations.getPaymentByAsaasId, {
              asaasPaymentId: payment.id,
            });

            if (existingPayment) {
              // @ts-ignore
              await ctx.runMutation(internal.asaas.mutations.updatePaymentFromAsaas, {
                paymentId: existingPayment._id,
                status: payment.status,
                netValue: payment.netValue,
                confirmedDate: payment.paymentDate ? new Date(payment.paymentDate).getTime() : undefined,
              });
              paymentsUpdated++;
            } else {
              // @ts-ignore
              const student = await ctx.runQuery(internal.asaas.mutations.getStudentByAsaasId, {
                asaasCustomerId: payment.customer,
              });

              if (student) {
                // @ts-ignore
                await ctx.runMutation(internal.asaas.mutations.createPaymentFromAsaas, {
                  studentId: student._id,
                  asaasPaymentId: payment.id,
                  asaasCustomerId: payment.customer,
                  value: payment.value,
                  netValue: payment.netValue,
                  status: payment.status,
                  dueDate: new Date(payment.dueDate).getTime(),
                  billingType: payment.billingType,
                  description: payment.description,
                  boletoUrl: payment.bankSlipUrl,
                  confirmedDate: payment.paymentDate ? new Date(payment.paymentDate).getTime() : undefined,
                  organizationId,
                });
                paymentsCreated++;
              } else {
                paymentsErrors.push(`Payment ${payment.id}: Student not found for customer ${payment.customer}`);
                paymentsFailed++;
              }
            }
          } catch (err: any) {
            paymentsFailed++;
            paymentsErrors.push(`Payment ${payment.id}: ${err.message}`);
          }
        }

        paymentsHasMore = response.hasMore;
        paymentsOffset += limit;
      }

      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId: paymentsLogId,
        status: 'completed' as const,
        recordsProcessed: paymentsProcessed,
        recordsCreated: paymentsCreated,
        recordsUpdated: paymentsUpdated,
        recordsFailed: paymentsFailed,
        errors: paymentsErrors.length > 0 ? paymentsErrors.slice(0, 50) : undefined,
        completedAt: Date.now(),
      });
    } catch (error: any) {
      paymentsSuccess = false;
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId: paymentsLogId,
        status: 'failed' as const,
        recordsProcessed: paymentsProcessed,
        recordsCreated: paymentsCreated,
        recordsUpdated: paymentsUpdated,
        recordsFailed: paymentsFailed,
        errors: [error.message, ...paymentsErrors].slice(0, 50),
        completedAt: Date.now(),
      });
    }

    const paymentsResult: ImportResult = {
      success: paymentsSuccess,
      recordsProcessed: paymentsProcessed,
      recordsCreated: paymentsCreated,
      recordsUpdated: paymentsUpdated,
      recordsFailed: paymentsFailed,
    };

    // ═══════════════════════════════════════════════════════
    // STEP 3: IMPORT SUBSCRIPTIONS
    // ═══════════════════════════════════════════════════════

    // @ts-ignore
    const subscriptionsLogId = await ctx.runMutation(internal.asaas.sync.createSyncLog, {
      syncType: 'subscriptions' as const,
      initiatedBy: args.initiatedBy,
    });

    let subscriptionsOffset = 0;
    let subscriptionsHasMore = true;
    let subscriptionsProcessed = 0;
    let subscriptionsCreated = 0;
    let subscriptionsUpdated = 0;
    let subscriptionsFailed = 0;
    const subscriptionsErrors: string[] = [];
    let subscriptionsPageCount = 0;
    let subscriptionsSuccess = true;

    try {
      while (subscriptionsHasMore && subscriptionsPageCount < MAX_PAGES) {
        subscriptionsPageCount++;
        const response = await client.listAllSubscriptions({ offset: subscriptionsOffset, limit });

        for (const sub of response.data) {
          subscriptionsProcessed++;
          try {
            // @ts-ignore
            const existingSubscription = await ctx.runQuery(internal.asaas.mutations.getSubscriptionByAsaasId, {
              asaasSubscriptionId: sub.id,
            });

            if (existingSubscription) {
              // @ts-ignore
              await ctx.runMutation(internal.asaas.mutations.updateSubscriptionFromAsaas, {
                subscriptionId: existingSubscription._id,
                status: sub.status,
                nextDueDate: dateStringToTimestamp(sub.nextDueDate),
                value: sub.value,
              });
              subscriptionsUpdated++;
            } else {
              // @ts-ignore
              const student = await ctx.runQuery(internal.asaas.mutations.getStudentByAsaasId, {
                asaasCustomerId: sub.customer,
              });

              if (student) {
                // @ts-ignore
                await ctx.runMutation(internal.asaas.mutations.createSubscriptionFromAsaas, {
                  studentId: student._id,
                  asaasSubscriptionId: sub.id,
                  asaasCustomerId: sub.customer,
                  value: sub.value,
                  cycle: sub.cycle,
                  status: sub.status,
                  nextDueDate: dateStringToTimestamp(sub.nextDueDate),
                  description: sub.description,
                  organizationId,
                });
                subscriptionsCreated++;
              } else {
                subscriptionsErrors.push(`Subscription ${sub.id}: Student not found for customer ${sub.customer}`);
                subscriptionsFailed++;
              }
            }
          } catch (err: any) {
            subscriptionsFailed++;
            subscriptionsErrors.push(`Subscription ${sub.id}: ${err.message}`);
          }
        }

        subscriptionsHasMore = response.hasMore;
        subscriptionsOffset += limit;
      }

      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId: subscriptionsLogId,
        status: 'completed' as const,
        recordsProcessed: subscriptionsProcessed,
        recordsCreated: subscriptionsCreated,
        recordsUpdated: subscriptionsUpdated,
        recordsFailed: subscriptionsFailed,
        errors: subscriptionsErrors.length > 0 ? subscriptionsErrors.slice(0, 50) : undefined,
        completedAt: Date.now(),
      });
    } catch (error: any) {
      subscriptionsSuccess = false;
      // @ts-ignore
      await ctx.runMutation(internal.asaas.sync.updateSyncLog, {
        logId: subscriptionsLogId,
        status: 'failed' as const,
        recordsProcessed: subscriptionsProcessed,
        recordsCreated: subscriptionsCreated,
        recordsUpdated: subscriptionsUpdated,
        recordsFailed: subscriptionsFailed,
        errors: [error.message, ...subscriptionsErrors].slice(0, 50),
        completedAt: Date.now(),
      });
    }

    const subscriptionsResult: ImportResult = {
      success: subscriptionsSuccess,
      recordsProcessed: subscriptionsProcessed,
      recordsCreated: subscriptionsCreated,
      recordsUpdated: subscriptionsUpdated,
      recordsFailed: subscriptionsFailed,
    };

    return {
      success: customersSuccess && paymentsSuccess && subscriptionsSuccess,
      customers: customersResult,
      payments: paymentsResult,
      subscriptions: subscriptionsResult,
    };
  },
});
