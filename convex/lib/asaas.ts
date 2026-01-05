/**
 * Asaas Payment API Client Library
 *
 * Type-safe client for Asaas API v3 integration.
 * Provides typed wrappers for customers, payments, subscriptions, and webhooks.
 *
 * @see https://docs.asaas.com/reference/introducao
 */

// ═══════════════════════════════════════════════════════
// TYPES - Asaas API Request/Response Payloads
// ═══════════════════════════════════════════════════════

/**
 * Customer creation/update payload
 */
export interface AsaasCustomerPayload {
  name: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
}

/**
 * Customer response from Asaas API
 */
export interface AsaasCustomerResponse {
  id: string;
  dateCreated: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country?: string;
  externalReference?: string;
  notificationDisabled: boolean;
  additionalEmails?: string;
  personType: "FISICA" | "JURIDICA";
}

/**
 * Payment creation payload
 */
export interface AsaasPaymentPayload {
  customer: string; // Customer ID
  billingType: "BOLETO" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "UNDEFINED";
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  totalValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: "FIXED" | "PERCENTAGE";
  };
  fine?: {
    value: number;
    type: "FIXED" | "PERCENTAGE";
  };
  interest?: {
    value: number;
    type: "PERCENTAGE";
  };
  postalService?: boolean;
}

/**
 * Payment response from Asaas API
 */
export interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  customer: string;
  subscription?: string;
  installment?: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description?: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "UNDEFINED";
  status:
    | "PENDING"
    | "CONFIRMED"
    | "RECEIVED"
    | "RECEIVED_IN_CASH"
    | "OVERDUE"
    | "REFUNDED"
    | "RECEIVED_IN_CASH_UNDONE"
    | "CHARGEBACK_REQUESTED"
    | "CHARGEBACK_DISPUTE"
    | "AWAITING_CHARGEBACK_REVERSAL"
    | "DUNNING_REQUESTED"
    | "DUNNING_RECEIVED"
    | "AWAITING_RISK_ANALYSIS"
    | "APPROVED_BY_RISK_ANALYSIS"
    | "REJECTED_BY_RISK_ANALYSIS"
    | "DELETED"
    | "CANCELLED";
  dueDate: string; // YYYY-MM-DD
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  transactionReceiptUrl?: string;
  nossoNumero?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  identificationField?: string;
  externalReference?: string;
  deleted?: boolean;
  postalService?: boolean;
  creditDate?: string;
  estimatedCreditDate?: string;
  // PIX fields
  pixTransactionId?: string;
  pixQrCodeId?: string;
  pixQrCode?: string;
  // Credit card fields
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };
}

/**
 * Subscription creation payload
 */
export interface AsaasSubscriptionPayload {
  customer: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "UNDEFINED";
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle:
    | "WEEKLY"
    | "BIWEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "SEMIANNUALLY"
    | "YEARLY";
  description?: string;
  externalReference?: string;
  updatePendingPayments?: boolean;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: "FIXED" | "PERCENTAGE";
  };
  fine?: {
    value: number;
    type: "FIXED" | "PERCENTAGE";
  };
  interest?: {
    value: number;
    type: "PERCENTAGE";
  };
}

/**
 * Subscription response from Asaas API
 */
export interface AsaasSubscriptionResponse {
  id: string;
  dateCreated: string;
  customer: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "UNDEFINED";
  value: number;
  nextDueDate: string;
  cycle:
    | "WEEKLY"
    | "BIWEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "SEMIANNUALLY"
    | "YEARLY";
  description?: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "CANCELLED";
  externalReference?: string;
}

/**
 * Payment list response
 */
export interface AsaasPaymentListResponse {
  object: "list";
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasPaymentResponse[];
}

/**
 * Asaas API Error
 */
export interface AsaasApiError {
  errors?: Array<{
    code: string;
    description: string;
  }>;
  message?: string;
}

/**
 * Customer list response
 */
export interface AsaasCustomerListResponse {
  object: "list";
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasCustomerResponse[];
}

/**
 * Subscription list response
 */
export interface AsaasSubscriptionListResponse {
  object: "list";
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasSubscriptionResponse[];
}

/**
 * Financial statistics response from Asaas
 */
export interface AsaasFinancialStatistics {
  incomeValue: number;
  pendingValue: number;
  overdueValue: number;
  receivedValue: number;
}

/**
 * Financial summary response (custom aggregated)
 */
export interface AsaasFinancialSummaryResponse {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  totalValue: number;
  paymentsCount: number;
  periodStart?: string;
  periodEnd?: string;
}

// ═══════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════

const ASAAS_API_BASE = process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3";
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert date string (YYYY-MM-DD) to timestamp (start of day in UTC)
 */
export function dateStringToTimestamp(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00.000Z");
  return date.getTime();
}

/**
 * Convert timestamp to date string (YYYY-MM-DD)
 */
export function timestampToDateString(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ═══════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════

/**
 * Circuit breaker states
 */
type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  halfOpenTestCalls: number; // Number of test calls in half-open state
}

const CIRCUIT_CONFIG = {
  failureThreshold: 3, // Open circuit after 3 consecutive failures (reduced from 5 for faster detection)
  resetTimeoutMs: 60000, // Wait 60s before attempting recovery
  halfOpenMaxTestCalls: 3, // Allow 3 test calls in half-open state
};

let circuitState: CircuitBreakerState = {
  state: "closed",
  failureCount: 0,
  lastFailureTime: 0,
  nextAttemptTime: 0,
  halfOpenTestCalls: 0,
};

/**
 * Check if circuit breaker allows requests
 * Exposed for shared use by AsaasClient
 */
/**
 * Check if circuit breaker allows requests
 * Exposed for shared use by AsaasClient
 */
export function checkCircuitBreaker(): boolean {
  const now = Date.now();

  if (circuitState.state === "closed") {
    return true;
  }

  if (circuitState.state === "open") {
    // Check if we can transition to half-open
    if (now >= circuitState.nextAttemptTime) {
      circuitState.state = "half-open";
      circuitState.halfOpenTestCalls = 0;
      console.log(`[${new Date().toISOString()}] [CircuitBreaker] Transitioning to HALF-OPEN state after ${CIRCUIT_CONFIG.resetTimeoutMs / 1000}s reset timeout`);
      return true;
    }
    return false;
  }

  if (circuitState.state === "half-open") {
    // Allow test calls up to the limit
    return circuitState.halfOpenTestCalls < CIRCUIT_CONFIG.halfOpenMaxTestCalls;
  }

  return false;
}

/**
 * Record a successful API call
 * Exposed for shared use by AsaasClient
 */
export function recordSuccess(): void {
  if (circuitState.state === "half-open") {
    circuitState.halfOpenTestCalls++;
    // If all test calls succeeded, close the circuit
    if (circuitState.halfOpenTestCalls >= CIRCUIT_CONFIG.halfOpenMaxTestCalls) {
      circuitState.state = "closed";
      circuitState.failureCount = 0;
      circuitState.halfOpenTestCalls = 0;
      console.log(`[${new Date().toISOString()}] [CircuitBreaker] Circuit CLOSED after ${CIRCUIT_CONFIG.halfOpenMaxTestCalls} successful test calls`);
    }
  } else if (circuitState.state === "closed") {
    circuitState.failureCount = 0;
  }
}

/**
 * Record a failed API call
 * Exposed for shared use by AsaasClient
 */
export function recordFailure(): void {
  circuitState.failureCount++;
  circuitState.lastFailureTime = Date.now();

  if (circuitState.state === "half-open") {
    // Half-open test failed, open the circuit again
    circuitState.state = "open";
    circuitState.nextAttemptTime = Date.now() + CIRCUIT_CONFIG.resetTimeoutMs;
    console.log("[CircuitBreaker] Half-open test failed, opening circuit");
  } else if (circuitState.failureCount >= CIRCUIT_CONFIG.failureThreshold) {
    // Threshold reached, open the circuit
    circuitState.state = "open";
    circuitState.nextAttemptTime = Date.now() + CIRCUIT_CONFIG.resetTimeoutMs;
    console.error(`[CircuitBreaker] Circuit opened after ${circuitState.failureCount} failures`);
  }
}

/**
 * Get current circuit breaker state (for monitoring)
 */
export function getCircuitBreakerState(): CircuitBreakerState {
  return { ...circuitState };
}

/**
 * Reset circuit breaker manually (for recovery)
 */
export function resetCircuitBreaker(): void {
  circuitState.state = 'closed';
  circuitState.failureCount = 0;
  circuitState.lastFailureTime = 0;
  circuitState.nextAttemptTime = 0;
  circuitState.halfOpenTestCalls = 0;
  console.log(`[${new Date().toISOString()}] [CircuitBreaker] Manually reset to CLOSED state`);
}

/**
 * Add jitter to delay to prevent thundering herd
 */
function addJitter(delayMs: number): number {
  const jitter = Math.random() * 1000; // 0-1000ms jitter
  return delayMs + jitter;
}

// ═══════════════════════════════════════════════════════
// ASAAS API CLIENT
// ═══════════════════════════════════════════════════════

/**
 * Generic fetch wrapper for Asaas API
 * Handles authentication, retry logic, error handling, and response parsing
 * Includes logging for audit trail and monitoring.
 */
async function asaasFetch<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    apiKey?: string;
    retries?: number;
  } = {},
): Promise<T> {
  const apiKey = options.apiKey || process.env.ASAAS_API_KEY;
  const retries = options.retries ?? MAX_RETRIES;

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY environment variable is not set");
  }

  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    const waitTimeMs = circuitState.nextAttemptTime - Date.now();
    throw new Error(
      `Circuit breaker is ${circuitState.state}. API requests are blocked. Retry in ${Math.ceil(waitTimeMs / 1000)}s`
    );
  }

  const url = `${ASAAS_API_BASE}${endpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(
          `Asaas API attempt ${attempt + 1}/${retries + 1} for ${endpoint}`,
        );
      }

      const response = await fetch(url, {
        method: options.method || "GET",
        headers: {
          access_token: apiKey,
          "Content-Type": "application/json",
          "User-Agent": "gpus-saas/1.0",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      // Handle no content responses
      if (response.status === 204) {
        return undefined as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const error = data as AsaasApiError;
        const errorMessage =
          error.errors?.map((e) => `${e.code}: ${e.description}`).join(", ") ||
          error.message ||
          `HTTP ${response.status}`;

        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          // 429 is Too Many Requests, which IS retriable
          if (response.status !== 429) {
            throw new Error(`Asaas API Error: ${errorMessage}`);
          }
        }

        // Retry on server errors (5xx) or rate limiting (429)
        if (response.status >= 500 || response.status === 429) {
          lastError = new Error(`Asaas API Error: ${errorMessage}`);
          recordFailure(); // Circuit breaker: record server error
          if (attempt < retries) {
            const delay = addJitter(INITIAL_RETRY_DELAY * Math.pow(2, attempt));
            await sleep(delay);
            continue;
          }
          throw lastError;
        }

        // Client error (non-retriable 4xx)
        recordFailure(); // Circuit breaker: record client error
        throw new Error(`Asaas API Error: ${errorMessage}`);
      }

      // Success
      recordSuccess(); // Circuit breaker: record success
      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Circuit breaker: record network/timeout errors
      if (
        error instanceof Error &&
        (error.name.includes("TimeoutError") || error.message.includes("fetch"))
      ) {
        recordFailure();
      }

      // Don't retry on non-network errors (unless it's a 5xx handled above)
      if (
        error instanceof Error &&
        !error.message.includes("Asaas API Error") &&
        !error.name.includes("TimeoutError") &&
        !error.message.includes("fetch")
      ) {
        throw error;
      }

      // Retry on network errors or server errors
      if (attempt < retries) {
        const delay = addJitter(INITIAL_RETRY_DELAY * Math.pow(2, attempt));
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error("Unknown error in asaasFetch");
}

/**
 * Get response time from start time
 */
export function getResponseTime(startTime: number): number {
  return Date.now() - startTime;
}

// ═══════════════════════════════════════════════════════
// CUSTOMERS API
// ═══════════════════════════════════════════════════════

export const asaasCustomers = {
  /**
   * Create a new customer
   */
  async create(payload: AsaasCustomerPayload): Promise<AsaasCustomerResponse> {
    return asaasFetch<AsaasCustomerResponse>("/customers", {
      method: "POST",
      body: payload,
    });
  },

  /**
   * Update an existing customer
   */
  async update(
    customerId: string,
    payload: Partial<AsaasCustomerPayload>,
  ): Promise<AsaasCustomerResponse> {
    return asaasFetch<AsaasCustomerResponse>(`/customers/${customerId}`, {
      method: "POST",
      body: payload,
    });
  },

  /**
   * Get customer by ID
   */
  async get(customerId: string): Promise<AsaasCustomerResponse> {
    return asaasFetch<AsaasCustomerResponse>(`/customers/${customerId}`);
  },

  /**
   * List customers with filters
   */
  async list(params?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    offset?: number;
    limit?: number;
  }): Promise<{
    object: string;
    hasMore: boolean;
    totalCount: number;
    data: AsaasCustomerResponse[];
  }> {
    const queryParams = new URLSearchParams();
    if (params?.name) queryParams.append("name", params.name);
    if (params?.email) queryParams.append("email", params.email);
    if (params?.cpfCnpj) queryParams.append("cpfCnpj", params.cpfCnpj);
    if (params?.offset) queryParams.append("offset", String(params.offset));
    if (params?.limit) queryParams.append("limit", String(params.limit));

    const query = queryParams.toString();
    return asaasFetch(`/customers${query ? `?${query}` : ""}`);
  },
};

// ═══════════════════════════════════════════════════════
// PAYMENTS API
// ═══════════════════════════════════════════════════════

export const asaasPayments = {
  /**
   * Create a new payment
   */
  async create(payload: AsaasPaymentPayload): Promise<AsaasPaymentResponse> {
    return asaasFetch<AsaasPaymentResponse>("/payments", {
      method: "POST",
      body: payload,
    });
  },

  /**
   * Get payment by ID
   */
  async get(paymentId: string): Promise<AsaasPaymentResponse> {
    return asaasFetch<AsaasPaymentResponse>(`/payments/${paymentId}`);
  },

  /**
   * List payments with filters
   */
  async list(params?: {
    customer?: string;
    subscription?: string;
    status?: string;
    paymentDate?: string;
    dateCreated?: string;
    offset?: number;
    limit?: number;
  }): Promise<AsaasPaymentListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.customer) queryParams.append("customer", params.customer);
    if (params?.subscription)
      queryParams.append("subscription", params.subscription);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.paymentDate)
      queryParams.append("paymentDate[ge]", params.paymentDate);
    if (params?.dateCreated)
      queryParams.append("dateCreated[ge]", params.dateCreated);
    if (params?.offset) queryParams.append("offset", String(params.offset));
    if (params?.limit) queryParams.append("limit", String(params.limit));

    const query = queryParams.toString();
    return asaasFetch<AsaasPaymentListResponse>(
      `/payments${query ? `?${query}` : ""}`,
    );
  },

  /**
   * Delete (cancel) a payment
   */
  async delete(paymentId: string): Promise<void> {
    return asaasFetch<void>(`/payments/${paymentId}`, {
      method: "DELETE",
    });
  },

  /**
   * Get payment identification field (barcode for BOLETO)
   */
  async getIdentificationField(
    paymentId: string,
  ): Promise<{ identificationField: string }> {
    return asaasFetch<{ identificationField: string }>(
      `/payments/${paymentId}/identificationField`,
    );
  },
};

// ═══════════════════════════════════════════════════════
// SUBSCRIPTIONS API
// ═══════════════════════════════════════════════════════

export const asaasSubscriptions = {
  /**
   * Create a new subscription
   */
  async create(
    payload: AsaasSubscriptionPayload,
  ): Promise<AsaasSubscriptionResponse> {
    return asaasFetch<AsaasSubscriptionResponse>("/subscriptions", {
      method: "POST",
      body: payload,
    });
  },

  /**
   * Get subscription by ID
   */
  async get(subscriptionId: string): Promise<AsaasSubscriptionResponse> {
    return asaasFetch<AsaasSubscriptionResponse>(
      `/subscriptions/${subscriptionId}`,
    );
  },

  /**
   * Update subscription
   */
  async update(
    subscriptionId: string,
    payload: Partial<AsaasSubscriptionPayload>,
  ): Promise<AsaasSubscriptionResponse> {
    return asaasFetch<AsaasSubscriptionResponse>(
      `/subscriptions/${subscriptionId}`,
      {
        method: "POST",
        body: payload,
      },
    );
  },

  /**
   * Delete (cancel) a subscription
   */
  async delete(subscriptionId: string): Promise<void> {
    return asaasFetch<void>(`/subscriptions/${subscriptionId}`, {
      method: "DELETE",
    });
  },
};

// ═══════════════════════════════════════════════════════
// INSTANCE CLIENT (For dynamic auth)
// ═══════════════════════════════════════════════════════

export class AsaasClient {
  private config: { apiKey: string; baseUrl: string };

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl:
        config.baseUrl ||
        process.env.ASAAS_BASE_URL ||
        "https://api.asaas.com/v3",
    };
  }

  private async fetch<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: unknown;
      retries?: number;
    } = {}
  ): Promise<T> {
    const apiKey = this.config.apiKey;
    const retries = options.retries ?? MAX_RETRIES;

    if (!apiKey) {
      throw new Error("ASAAS_API_KEY is not configured for this client");
    }

    // Check circuit breaker
    if (!checkCircuitBreaker()) {
      const waitTimeMs = circuitState.nextAttemptTime - Date.now();
      throw new Error(
        `Circuit breaker is ${circuitState.state}. API requests are blocked. Retry in ${Math.ceil(waitTimeMs / 1000)}s`
      );
    }

    const url = `${this.config.baseUrl}${endpoint}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `AsaasClient API attempt ${attempt + 1}/${retries + 1} for ${endpoint}`,
          );
        }

        const response = await fetch(url, {
          method: options.method || "GET",
          headers: {
            access_token: apiKey,
            "Content-Type": "application/json",
            "User-Agent": "gpus-saas/1.0",
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: AbortSignal.timeout(30000), // 30s timeout
        });

        // Handle no content responses
        if (response.status === 204) {
          return undefined as T;
        }

        const data = await response.json();

        if (!response.ok) {
          const error = data as AsaasApiError;
          const errorMessage =
            error.errors?.map((e) => `${e.code}: ${e.description}`).join(", ") ||
            error.message ||
            `HTTP ${response.status}`;

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            // 429 is Too Many Requests, which IS retriable
            if (response.status !== 429) {
              throw new Error(`Asaas API Error: ${errorMessage}`);
            }
          }

          // Retry on server errors (5xx) or rate limiting (429)
          if (response.status >= 500 || response.status === 429) {
            lastError = new Error(`Asaas API Error: ${errorMessage}`);
            recordFailure(); // Circuit breaker: record server error
            if (attempt < retries) {
              const delay = addJitter(INITIAL_RETRY_DELAY * Math.pow(2, attempt));
              await sleep(delay);
              continue;
            }
            throw lastError;
          }

          // Client error (non-retriable 4xx)
          recordFailure(); // Circuit breaker: record client error
          throw new Error(`Asaas API Error: ${errorMessage}`);
        }

        // Success
        recordSuccess(); // Circuit breaker: record success
        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Circuit breaker: record network/timeout errors
        if (
          error instanceof Error &&
          (error.name.includes("TimeoutError") || error.message.includes("fetch"))
        ) {
          recordFailure();
        }

        // Don't retry on non-network errors (unless it's a 5xx handled above)
        if (
          error instanceof Error &&
          !error.message.includes("Asaas API Error") &&
          !error.name.includes("TimeoutError") &&
          !error.message.includes("fetch")
        ) {
          throw error;
        }

        // Retry on network errors or server errors
        if (attempt < retries) {
          const delay = addJitter(INITIAL_RETRY_DELAY * Math.pow(2, attempt));
          await sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error("Unknown error in AsaasClient.fetch");
  }

  public async testConnection(): Promise<any> {
    try {
      const response = await this.fetch<any>("/customers?limit=1");
      // Return a mocked response-like object or the data, adapted for actions.ts usage
      // actions.ts expects response.status
      return { status: 200, ...response };
    } catch (error: any) {
      // If fetch throws, we might want to ensure it has response.status if possible
      throw error;
    }
  }

  public async createCustomer(
    payload: AsaasCustomerPayload,
  ): Promise<AsaasCustomerResponse> {
    // Strict CPF normalization before sending to Asaas
    if (payload.cpfCnpj) {
      payload.cpfCnpj = payload.cpfCnpj.replace(/\D/g, "");
    }
    return this.fetch<AsaasCustomerResponse>("/customers", {
      method: "POST",
      body: payload,
    });
  }

  public async createPayment(
    payload: AsaasPaymentPayload,
  ): Promise<AsaasPaymentResponse> {
    return this.fetch<AsaasPaymentResponse>("/payments", {
      method: "POST",
      body: payload,
    });
  }

  public async getPixQrCode(
    paymentId: string,
  ): Promise<{ encodedImage: string; payload: string }> {
    return this.fetch<{ encodedImage: string; payload: string }>(
      `/payments/${paymentId}/pixQrCode`,
      {
        method: "GET",
      },
    );
  }

  public async createSubscription(
    payload: AsaasSubscriptionPayload,
  ): Promise<AsaasSubscriptionResponse> {
    return this.fetch<AsaasSubscriptionResponse>("/subscriptions", {
      method: "POST",
      body: payload,
    });
  }

  /**
   * List all customers with pagination
   */
  public async listAllCustomers(params?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    offset?: number;
    limit?: number;
  }): Promise<AsaasCustomerListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.name) queryParams.append("name", params.name);
    if (params?.email) queryParams.append("email", params.email);
    if (params?.cpfCnpj) queryParams.append("cpfCnpj", params.cpfCnpj);
    if (params?.offset !== undefined)
      queryParams.append("offset", String(params.offset));
    if (params?.limit !== undefined)
      queryParams.append("limit", String(params.limit));

    const query = queryParams.toString();
    return this.fetch<AsaasCustomerListResponse>(
      `/customers${query ? `?${query}` : ""}`,
    );
  }

  /**
   * List all payments with filters
   */
  public async listAllPayments(params?: {
    customer?: string;
    status?: string;
    billingType?: string;
    dateCreatedGe?: string; // Date created >= (YYYY-MM-DD)
    dateCreatedLe?: string; // Date created <= (YYYY-MM-DD)
    paymentDateGe?: string; // Payment date >= (YYYY-MM-DD)
    paymentDateLe?: string; // Payment date <= (YYYY-MM-DD)
    offset?: number;
    limit?: number;
  }): Promise<AsaasPaymentListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.customer) queryParams.append("customer", params.customer);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.billingType)
      queryParams.append("billingType", params.billingType);
    if (params?.dateCreatedGe)
      queryParams.append("dateCreated[ge]", params.dateCreatedGe);
    if (params?.dateCreatedLe)
      queryParams.append("dateCreated[le]", params.dateCreatedLe);
    if (params?.paymentDateGe)
      queryParams.append("paymentDate[ge]", params.paymentDateGe);
    if (params?.paymentDateLe)
      queryParams.append("paymentDate[le]", params.paymentDateLe);
    if (params?.offset !== undefined)
      queryParams.append("offset", String(params.offset));
    if (params?.limit !== undefined)
      queryParams.append("limit", String(params.limit));

    const query = queryParams.toString();
    return this.fetch<AsaasPaymentListResponse>(
      `/payments${query ? `?${query}` : ""}`,
    );
  }

  /**
   * Get a single payment by ID
   */
  public async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.fetch<AsaasPaymentResponse>(`/payments/${paymentId}`);
  }

  /**
   * List all subscriptions with filters
   */
  public async listAllSubscriptions(params?: {
    customer?: string;
    status?: "ACTIVE" | "INACTIVE" | "EXPIRED";
    offset?: number;
    limit?: number;
  }): Promise<AsaasSubscriptionListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.customer) queryParams.append("customer", params.customer);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.offset !== undefined)
      queryParams.append("offset", String(params.offset));
    if (params?.limit !== undefined)
      queryParams.append("limit", String(params.limit));

    const query = queryParams.toString();
    return this.fetch<AsaasSubscriptionListResponse>(
      `/subscriptions${query ? `?${query}` : ""}`,
    );
  }

  /**
   * Get financial summary for a period (aggregates payment data)
   * Note: Asaas doesn't have a direct financial summary endpoint,
   * so we aggregate from payments list
   */
  public async getFinancialSummary(params?: {
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
  }): Promise<AsaasFinancialSummaryResponse> {
    // Fetch all payments in the period to aggregate
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let totalReceived = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let totalValue = 0;
    let paymentsCount = 0;

    while (hasMore) {
      const response = await this.listAllPayments({
        dateCreatedGe: params?.startDate,
        dateCreatedLe: params?.endDate,
        offset,
        limit,
      });

      for (const payment of response.data) {
        paymentsCount++;
        totalValue += payment.value;

        if (payment.status === "RECEIVED" || payment.status === "CONFIRMED") {
          totalReceived += payment.netValue || payment.value;
        } else if (payment.status === "PENDING") {
          totalPending += payment.value;
        } else if (payment.status === "OVERDUE") {
          totalOverdue += payment.value;
        }
      }

      hasMore = response.hasMore;
      offset += limit;
    }

    return {
      totalReceived,
      totalPending,
      totalOverdue,
      totalValue,
      paymentsCount,
      periodStart: params?.startDate,
      periodEnd: params?.endDate,
    };
  }
}

export function createAsaasClient(config: {
  apiKey: string;
  baseUrl?: string;
}) {
  return new AsaasClient(config);
}

export function getAsaasClient() {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY not set");
  return new AsaasClient({ apiKey });
}

export function getAsaasWebhookSecret() {
  return process.env.ASAAS_WEBHOOK_SECRET;
}
