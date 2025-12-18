import axios, { type AxiosInstance, type AxiosError } from "axios";

const ASAAS_API_URL = process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

export class AsaasClient {
  private client: AxiosInstance;

  constructor() {
    if (!ASAAS_API_KEY) {
      console.warn("ASAAS_API_KEY is not set.");
    }

    this.client = axios.create({
      baseURL: ASAAS_API_URL,
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY || "",
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
}

export const asaasClient = new AsaasClient();
