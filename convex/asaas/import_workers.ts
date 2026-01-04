/**
 * Asaas Import Workers
 *
 * Worker functions for processing Asaas customers, payments, and subscriptions.
 * Each worker handles validation, deduplication, and creation/updates.
 *
 * These workers are designed to work with the batch processor for concurrent
 * execution with error isolation.
 */

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { WorkerResult } from "./batch_processor";
import type {
  AsaasCustomerResponse,
  AsaasPaymentResponse,
  AsaasSubscriptionResponse,
  StudentWithAsaas,
  PaymentDoc,
  SubscriptionDoc,
} from "./types";

// ═══════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Validate CPF (Brazilian tax ID)
 * Format: XXX.XXX.XXX-XX or XXXXXXXXXXX
 */
function validateCPF(cpf: string): boolean {
  if (!cpf) return false;

  // Remove non-digits
  const clean = cpf.replace(/\D/g, "");

  // Must be 11 digits
  if (clean.length !== 11) return false;

  // All same digits is invalid
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(clean.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(clean.charAt(10))) return false;

  return true;
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  if (!email) return false; // Email is optional
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate Brazilian phone number
 * Accepts: (XX) XXXXX-XXXX, (XX) XXXX-XXXX, XX XXXXX-XXXX, etc.
 */
function validatePhone(phone: string): boolean {
  if (!phone) return false; // Phone is optional but recommended
  const clean = phone.replace(/\D/g, "");
  // Brazilian mobile: 11 digits (XX 9XXXX-XXXX), landline: 10 digits
  return clean.length === 10 || clean.length === 11;
}

/**
 * Sanitize data for LGPD compliance
 * - Remove sensitive data from error messages
 * - Partially mask CPF/phone in logs
 */
function sanitizeForLog(data: { cpf?: string; phone?: string }): string {
  const parts: string[] = [];
  if (data.cpf) {
    parts.push(`CPF: ***${data.cpf.slice(-3)}`);
  }
  if (data.phone) {
    parts.push(`Phone: ***${data.phone.slice(-3)}`);
  }
  return parts.join(", ") || "(no sensitive info)";
}

// ═══════════════════════════════════════════════════════
// CUSTOMER WORKER
// ═══════════════════════════════════════════════════════

/**
 * Process a single customer from Asaas
 *
 * This worker:
 * 1. Validates CPF, email, and phone
 * 2. Checks for existing students by asaasCustomerId, email, or CPF
 * 3. Creates or updates student record
 * 4. Returns structured result with appropriate flags
 */
export async function processCustomerWorker(
  ctx: any,
  customer: AsaasCustomerResponse,
  organizationId?: string,
): Promise<WorkerResult<StudentWithAsaas>> {
  // Validation
  if (customer.cpfCnpj && !validateCPF(customer.cpfCnpj)) {
    return {
      success: false,
      skipped: true,
      reason: "Invalid CPF format",
    };
  }

  if (customer.email && !validateEmail(customer.email)) {
    return {
      success: false,
      skipped: true,
      reason: "Invalid email format",
    };
  }

  const phone = customer.phone || customer.mobilePhone;
  if (phone && !validatePhone(phone)) {
    return {
      success: false,
      skipped: true,
      reason: "Invalid phone format",
    };
  }

  try {
    // Check if student exists with this asaasCustomerId
    let existingStudent = await ctx.runQuery(
      // @ts-ignore - Deep type instantiation
      internal.asaas.mutations.getStudentByAsaasId,
      {
        asaasCustomerId: customer.id,
      },
    );

    // Deduplication: If not found by ID, try to find by Email or CPF
    if (!existingStudent && (customer.email || customer.cpfCnpj)) {
      const duplicate = await ctx.runQuery(
        // @ts-ignore - Deep type instantiation
        internal.asaas.mutations.getStudentByEmailOrCpf,
        {
          // Convert null to undefined (Asaas API may return null, but Convex validators expect undefined)
          email: customer.email ?? undefined,
          cpf: customer.cpfCnpj ?? undefined,
        },
      );

      if (duplicate) {
        console.log(
          `[CustomerWorker] Matched existing student by Email/CPF. Linking Asaas ID ${customer.id}`,
        );
        // Link the found student to this Asaas Customer ID
        // @ts-ignore - Deep type instantiation
        await ctx.runMutation(internal.asaas.mutations.updateStudentAsaasId, {
          studentId: duplicate._id,
          asaasCustomerId: customer.id,
        });

        existingStudent = duplicate;
      }
    }

    if (existingStudent) {
      // Update existing student
      // @ts-ignore - Deep type instantiation
      await ctx.runMutation(internal.asaas.mutations.updateStudentFromAsaas, {
        studentId: existingStudent._id,
        name: customer.name,
        email: customer.email ?? undefined,
        phone: phone || "",
        cpf: customer.cpfCnpj ?? undefined,
      });

      return {
        success: true,
        data: existingStudent as StudentWithAsaas,
        updated: true,
      };
    }

    // Create new student
    // @ts-ignore - Deep type instantiation
    const studentId = await ctx.runMutation(
      internal.asaas.mutations.createStudentFromAsaas,
      {
        name: customer.name,
        email: customer.email ?? undefined,
        phone: phone || "",
        cpf: customer.cpfCnpj ?? undefined,
        asaasCustomerId: customer.id,
        organizationId,
      },
    );

    return {
      success: true,
      data: {
        _id: studentId as Id<"students">,
        name: customer.name,
        email: customer.email ?? undefined,
        phone: phone || "",
        cpf: customer.cpfCnpj ?? undefined,
        asaasCustomerId: customer.id,
        organizationId,
      },
      created: true,
    };
  } catch (error: any) {
    console.error(
      `[CustomerWorker] Failed to process customer ${customer.id}:`,
      sanitizeForLog({ cpf: customer.cpfCnpj, phone: customer.phone }),
      error.message,
    );
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

// ═══════════════════════════════════════════════════════
// PAYMENT WORKER
// ═══════════════════════════════════════════════════════

/**
 * Process a single payment from Asaas
 *
 * This worker:
 * 1. Validates payment data
 * 2. Checks for existing payment by asaasPaymentId
 * 3. Finds associated student by asaasCustomerId
 * 4. Creates or updates payment record
 */
export async function processPaymentWorker(
  ctx: any,
  payment: AsaasPaymentResponse,
  organizationId?: string,
): Promise<WorkerResult<PaymentDoc>> {
  try {
    // Check if payment exists
    // @ts-ignore - Deep type instantiation
    const existingPayment = await ctx.runQuery(
      internal.asaas.mutations.getPaymentByAsaasId,
      {
        asaasPaymentId: payment.id,
      },
    );

    if (existingPayment) {
      // Update existing payment
      // @ts-ignore - Deep type instantiation
      await ctx.runMutation(internal.asaas.mutations.updatePaymentFromAsaas, {
        paymentId: existingPayment._id,
        status: payment.status,
        netValue: payment.netValue,
        confirmedDate: payment.paymentDate
          ? new Date(payment.paymentDate).getTime()
          : undefined,
      });

      return {
        success: true,
        data: existingPayment as PaymentDoc,
        updated: true,
      };
    }

    // Find student by asaasCustomerId
    // @ts-ignore - Deep type instantiation
    const student = await ctx.runQuery(
      internal.asaas.mutations.getStudentByAsaasId,
      {
        asaasCustomerId: payment.customer,
      },
    );

    if (!student) {
      return {
        success: false,
        skipped: true,
        reason: `Student not found for asaasCustomerId: ${payment.customer}`,
      };
    }

    // Create new payment
    // @ts-ignore - Deep type instantiation
    const paymentId = await ctx.runMutation(
      internal.asaas.mutations.createPaymentFromAsaas,
      {
        studentId: student._id,
        asaasPaymentId: payment.id,
        asaasCustomerId: payment.customer,
        value: payment.value,
        netValue: payment.netValue,
        status: payment.status,
        dueDate: new Date(payment.dueDate).getTime(),
        billingType: payment.billingType,
        description: payment.description,
        boletoUrl: payment.bankSlipUrl ?? undefined, // Asaas API uses bankSlipUrl
        confirmedDate: payment.paymentDate
          ? new Date(payment.paymentDate).getTime()
          : undefined,
        installmentNumber: payment.installmentNumber,
        totalInstallments: payment.installmentNumber ? undefined : undefined, // Total not directly available in payment response
        organizationId,
      },
    );

    return {
      success: true,
      data: {
        _id: paymentId as Id<"asaasPayments">,
        studentId: student._id,
        asaasPaymentId: payment.id,
        asaasCustomerId: payment.customer,
        organizationId,
        value: payment.value,
        netValue: payment.netValue,
        status: payment.status,
        dueDate: new Date(payment.dueDate).getTime(),
        billingType: payment.billingType,
        description: payment.description,
        boletoUrl: payment.bankSlipUrl ?? undefined, // Asaas API uses bankSlipUrl
        confirmedDate: payment.paymentDate
          ? new Date(payment.paymentDate).getTime()
          : undefined,
        installmentNumber: payment.installmentNumber,
        totalInstallments: payment.installmentNumber ? undefined : undefined, // Total not directly available
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      created: true,
    };
  } catch (error: any) {
    console.error(
      `[PaymentWorker] Failed to process payment ${payment.id}:`,
      error.message,
    );
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

// ═══════════════════════════════════════════════════════
// SUBSCRIPTION WORKER
// ═══════════════════════════════════════════════════════

/**
 * Process a single subscription from Asaas
 *
 * This worker:
 * 1. Validates subscription data
 * 2. Checks for existing subscription by asaasSubscriptionId
 * 3. Finds associated student by asaasCustomerId
 * 4. Creates or updates subscription record
 */
export async function processSubscriptionWorker(
  ctx: any,
  subscription: AsaasSubscriptionResponse,
  organizationId?: string,
): Promise<WorkerResult<SubscriptionDoc>> {
  try {
    // Check if subscription exists
    // @ts-ignore - Deep type instantiation
    const existingSubscription = await ctx.runQuery(
      internal.asaas.mutations.getSubscriptionByAsaasId,
      {
        asaasSubscriptionId: subscription.id,
      },
    );

    if (existingSubscription) {
      // Update existing subscription
      // @ts-ignore - Deep type instantiation
      await ctx.runMutation(
        internal.asaas.mutations.updateSubscriptionFromAsaas,
        {
          subscriptionId: existingSubscription._id,
          status: subscription.status,
          value: subscription.value,
          nextDueDate: subscription.nextDueDate
            ? new Date(subscription.nextDueDate).getTime()
            : undefined,
        },
      );

      return {
        success: true,
        data: existingSubscription as SubscriptionDoc,
        updated: true,
      };
    }

    // Find student by asaasCustomerId
    // @ts-ignore - Deep type instantiation
    const student = await ctx.runQuery(
      internal.asaas.mutations.getStudentByAsaasId,
      {
        asaasCustomerId: subscription.customer,
      },
    );

    if (!student) {
      return {
        success: false,
        skipped: true,
        reason: `Student not found for asaasCustomerId: ${subscription.customer}`,
      };
    }

    // Create new subscription
    // @ts-ignore - Deep type instantiation
    const subscriptionId = await ctx.runMutation(
      internal.asaas.mutations.createSubscriptionFromAsaas,
      {
        studentId: student._id,
        asaasSubscriptionId: subscription.id,
        asaasCustomerId: subscription.customer,
        value: subscription.value,
        cycle: subscription.cycle,
        status: subscription.status,
        nextDueDate: new Date(subscription.nextDueDate).getTime(),
        description: subscription.description,
        organizationId,
      },
    );

    return {
      success: true,
      data: {
        _id: subscriptionId as Id<"asaasSubscriptions">,
        studentId: student._id,
        asaasSubscriptionId: subscription.id,
        asaasCustomerId: subscription.customer,
        organizationId,
        value: subscription.value,
        cycle: subscription.cycle,
        status: subscription.status,
        nextDueDate: new Date(subscription.nextDueDate).getTime(),
        description: subscription.description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      created: true,
    };
  } catch (error: any) {
    console.error(
      `[SubscriptionWorker] Failed to process subscription ${subscription.id}:`,
      error.message,
    );
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

// ═══════════════════════════════════════════════════════
// BATCH PROCESSING HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Create a batch processing function for customers
 */
export function createCustomerBatchProcessor(
  ctx: any,
  organizationId?: string,
) {
  return async (
    customer: AsaasCustomerResponse,
  ): Promise<WorkerResult<StudentWithAsaas>> => {
    return processCustomerWorker(ctx, customer, organizationId);
  };
}

/**
 * Create a batch processing function for payments
 */
export function createPaymentBatchProcessor(ctx: any, organizationId?: string) {
  return async (
    payment: AsaasPaymentResponse,
  ): Promise<WorkerResult<PaymentDoc>> => {
    return processPaymentWorker(ctx, payment, organizationId);
  };
}

/**
 * Create a batch processing function for subscriptions
 */
export function createSubscriptionBatchProcessor(
  ctx: any,
  organizationId?: string,
) {
  return async (
    subscription: AsaasSubscriptionResponse,
  ): Promise<WorkerResult<SubscriptionDoc>> => {
    return processSubscriptionWorker(ctx, subscription, organizationId);
  };
}
