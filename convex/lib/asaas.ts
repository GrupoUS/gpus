import axios, { type AxiosInstance, type AxiosError } from "axios";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

const DEFAULT_ASAAS_API_URL = process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3";
const DEFAULT_ASAAS_API_KEY = process.env.ASAAS_API_KEY;

export interface AsaasConfig {
  baseUrl?: string;
  apiKey?: string;
}

export class AsaasClient {
  private client: AxiosInstance;
  private config: AsaasConfig;

  constructor(config?: AsaasConfig) {
    this.config = config || {};
    const baseURL = this.config.baseUrl || DEFAULT_ASAAS_API_URL;
    const apiKey = this.config.apiKey || DEFAULT_ASAAS_API_KEY;

    // We suppress the warning here because we might strictly rely on DB config in some cases
    // if (!apiKey) {
    //   console.warn("ASAAS_API_KEY is not set.");
    // }

    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey || "",
        "User-Agent": "gpus-saas/1.0",
      },
      timeout: 30000,
    });

    // Add retry interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;
        if (!config || !config.retry) {
          return Promise.reject(error);
        }

        config.__retryCount = config.__retryCount || 0;

        if (config.__retryCount >= config.retry) {
          return Promise.reject(error);
        }

        config.__retryCount += 1;
        const backoff = Math.pow(2, config.__retryCount) * 1000;

        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.client(config);
      }
    );
  }

  async createCustomer(data: {
    name: string;
    cpfCnpj: string;
    email?: string;
    phone?: string;
    mobilePhone?: string;
    postalCode?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    externalReference: string;
    notificationDisabled?: boolean;
  }) {
    // Retry up to 3 times
    const config = { retry: 3 } as any;
    const response = await this.client.post("/customers", data, config);
    return response.data;
  }

  async createPayment(data: {
    customer: string;
    billingType: "BOLETO" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "UNDEFINED";
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
    installmentCount?: number;
    installmentValue?: number;
  }) {
    const config = { retry: 3 } as any;
    const response = await this.client.post("/payments", data, config);
    return response.data;
  }

  async createSubscription(data: {
    customer: string;
    billingType: "BOLETO" | "PIX" | "CREDIT_CARD";
    value: number;
    nextDueDate: string;
    cycle: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
    description?: string;
    externalReference?: string;
  }) {
    const config = { retry: 3 } as any;
    const response = await this.client.post("/subscriptions", data, config);
    return response.data;
  }

  async getPixQrCode(paymentId: string) {
      const config = { retry: 3 } as any;
      const response = await this.client.get(`/payments/${paymentId}/pixQrCode`, config);
      return response.data;
  }

  async getPayment(paymentId: string) {
      const config = { retry: 3 } as any;
      const response = await this.client.get(`/payments/${paymentId}`, config);
      return response.data;
  }

  /**
   * Test connection by making a lightweight API call
   * Used for validating credentials
   */
  async testConnection() {
    const config = { retry: 0 } as any; // No retry for test
    const response = await this.client.get("/customers?limit=1", config);
    return response;
  }

  /**
   * Get the underlying axios client (for advanced usage)
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Legacy default client (relies on env vars)
// Usage of this is discouraged if DB config is preferred
export const asaasClient = new AsaasClient();

/**
 * Creates an AsaasClient configured from the database (via internal query).
 * Falls back to env vars if DB config is missing.
 * Must be called from a Convex Action.
 */
export async function getAsaasClient(ctx: ActionCtx): Promise<AsaasClient> {
    const dbConfig = await ctx.runQuery(internal.settings.internalGetIntegrationConfig, {
        integrationName: "asaas"
    });

    const config: AsaasConfig = {
        baseUrl: dbConfig?.base_url || process.env.ASAAS_BASE_URL,
        apiKey: dbConfig?.api_key || process.env.ASAAS_API_KEY
    };

    // Also support webhook secret retrieval if needed in other contexts,
    // but client doesn't usually need it.

    return new AsaasClient(config);
}

/**
 * Helper to get the Webhook Secret (for http actions)
 */
export async function getAsaasWebhookSecret(ctx: ActionCtx): Promise<string | undefined> {
    const dbConfig = await ctx.runQuery(internal.settings.internalGetIntegrationConfig, {
        integrationName: "asaas"
    });

    return dbConfig?.webhook_secret || process.env.ASAAS_WEBHOOK_SECRET;
}

/**
 * Create AsaasClient with manual configuration
 */
export function createAsaasClient(config: AsaasConfig): AsaasClient {
  return new AsaasClient(config);
}
