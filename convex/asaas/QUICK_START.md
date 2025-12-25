# Asaas Integration - Quick Start Guide

**Purpose**: Quick reference for using the new Asaas integration modules

---

## 1. Immediate Fix Required

### Configure API Key in Railway

```bash
# Via Railway CLI
railway variables set ASAAS_API_KEY=your_production_api_key_here

# Or via Railway Dashboard
# Navigate to: Project > Settings > Variables > Add Variable
```

**Required Variables**:
- `ASAAS_API_KEY` - Your Asaas production API key
- `ASAAS_BASE_URL` - Optional (defaults to https://api.asaas.com/v3)
- `ASAAS_WEBHOOK_SECRET` - For webhook signature verification

---

## 2. Module Usage

### 2.1 Error Handling

```typescript
import {
  classifyError,
  getUserErrorMessage,
  isRetryableError,
  AsaasError
} from './asaas/errors'

// Classify any error
try {
  // API call
} catch (error) {
  const classified = classifyError(error)

  // Check if retryable
  if (isRetryableError(error)) {
    // Retry logic
  }

  // Get user-friendly message
  const userMessage = getUserErrorMessage(error)
  throw new Error(userMessage)
}
```

### 2.2 Validation

```typescript
import {
  AsaasCustomerPayloadSchema,
  validateCpfCnpj,
  sanitizeErrorMessage
} from './asaas/validation'

// Validate CPF/CNPJ
const cleanedCpf = validateCpfCnpj('123.456.789-01')

// Validate payload
const validated = AsaasCustomerPayloadSchema.parse({
  name: 'John Doe',
  cpfCnpj: cleanedCpf,
  email: 'john@example.com',
})

// Sanitize error message
const safeMessage = sanitizeErrorMessage('Error with API_KEY_abc123xyz')
// Returns: 'Error with [REDACTED]'
```

### 2.3 Retry Logic

```typescript
import {
  withRetry,
  withTimeoutAndRetry,
  createCircuitBreaker
} from './asaas/retry'

// Simple retry
const result = await withRetry(
  async () => {
    return await someApiCall()
  },
  { maxRetries: 3, initialDelayMs: 1000 }
)

// With timeout
const result = await withTimeoutAndRetry(
  async () => {
    return await someApiCall()
  },
  30000, // 30 second timeout
  { maxRetries: 3 }
)

// With circuit breaker
const circuitBreaker = createCircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60000,
})

const result = await withRetry(
  async () => {
    return await circuitBreaker.execute(async () => {
      return await someApiCall()
    })
  },
  { circuitBreaker }
)
```

### 2.4 API Client

```typescript
import {
  createAsaasClient,
  dateStringToTimestamp,
  timestampToDateString
} from './asaas/client'

// Create client
const client = createAsaasClient({
  apiKey: process.env.ASAAS_API_KEY,
  baseUrl: 'https://api.asaas.com/v3',
})

// Test connection
const testResult = await client.testConnection()
console.log('Connection:', testResult.success)

// Create customer
const customer = await client.createCustomer({
  name: 'John Doe',
  cpfCnpj: '12345678901',
  email: 'john@example.com',
  externalReference: 'student_123',
})

// List customers
const customers = await client.listAllCustomers({
  limit: 100,
  offset: 0,
})

// Create payment
const payment = await client.createPayment({
  customer: customer.id,
  billingType: 'PIX',
  value: 100.00,
  dueDate: '2025-12-31',
  externalReference: 'payment_123',
})

// Get PIX QR Code
const qrCode = await client.getPixQrCode(payment.id)
console.log('QR Code:', qrCode.encodedImage)
console.log('Payload:', qrCode.payload)

// Create subscription
const subscription = await client.createSubscription({
  customer: customer.id,
  billingType: 'BOLETO',
  value: 100.00,
  nextDueDate: '2025-12-31',
  cycle: 'MONTHLY',
  externalReference: 'subscription_123',
})

// Get financial summary
const summary = await client.getFinancialSummary({
  startDate: '2025-01-01',
  endDate: '2025-12-31',
})

// Check circuit breaker state
console.log('Circuit breaker:', client.getCircuitBreakerState())

// Reset circuit breaker (for recovery)
client.resetCircuitBreaker()
```

---

## 3. Integration Example

### Complete Action with All Features

```typescript
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { createAsaasClient } from './asaas/client'
import { classifyError, getUserErrorMessage } from './asaas/errors'
import { AsaasCustomerPayloadSchema, validateCpfCnpj } from './asaas/validation'

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
      // Step 1: Validate CPF/CNPJ
      const validatedCpfCnpj = validateCpfCnpj(args.cpfCnpj);

      // Step 2: Validate payload
      const validatedPayload = AsaasCustomerPayloadSchema.parse({
        name: args.name,
        cpfCnpj: validatedCpfCnpj,
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

      // Step 3: Get API client
      const client = await getAsaasClientFromSettings(ctx);

      // Step 4: Create customer (with automatic retry and circuit breaker)
      const customer = await client.createCustomer(validatedPayload);

      // Step 5: Save Asaas ID to student record
      // @ts-ignore - TypeScript has issues with deep type inference in Convex internal mutations
      await ctx.runMutation(internal.asaas.mutations.updateStudentAsaasId, {
        studentId: args.studentId,
        asaasCustomerId: customer.id,
      });

      return customer;
    } catch (error) {
      // Step 6: Classify error
      const classified = classifyError(error);

      // Step 7: Log error (sanitized)
      console.error('[createAsaasCustomer] Error:', classified.toJSON());

      // Step 8: Return user-friendly message
      throw new Error(getUserErrorMessage(classified));
    }
  },
});

// Helper function to get client
async function getAsaasClientFromSettings(ctx: any) {
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
```

---

## 4. Common Patterns

### 4.1 Idempotency

```typescript
// Use externalReference for idempotency
const uniqueId = `${studentId}_${Date.now()}_${operationType}`;

await client.createCustomer({
  ...payload,
  externalReference: uniqueId,
});
```

### 4.2 Error Recovery

```typescript
// Transient error - retry
if (error.isTransient) {
  // Automatic retry will handle this
}

// Permanent error - notify user
if (!error.isRetryable) {
  // Show user-friendly message
  alert(error.message);
}
```

### 4.3 Circuit Breaker Monitoring

```typescript
// Check circuit breaker state before critical operations
const state = client.getCircuitBreakerState();

if (state === 'OPEN') {
  // Circuit is open - service degraded
  console.warn('Circuit breaker OPEN - delaying operations');
  // Queue operation or notify user
} else if (state === 'HALF_OPEN') {
  // Circuit is testing - proceed with caution
  console.warn('Circuit breaker HALF_OPEN - testing recovery');
}
```

---

## 5. Testing Checklist

### Unit Tests
- [ ] CPF validation tests (valid/invalid)
- [ ] CNPJ validation tests (valid/invalid)
- [ ] Email validation tests
- [ ] Phone validation tests
- [ ] Error classification tests
- [ ] Retry logic tests
- [ ] Circuit breaker tests

### Integration Tests
- [ ] Connection test
- [ ] Customer creation
- [ ] Customer update
- [ ] Customer listing
- [ ] Payment creation
- [ ] PIX QR code retrieval
- [ ] Subscription creation
- [ ] Financial summary
- [ ] Error scenarios (4xx, 5xx)
- [ ] Retry behavior
- [ ] Circuit breaker behavior

### End-to-End Tests
- [ ] Full customer import
- [ ] Full payment import
- [ ] Full subscription import
- [ ] Error recovery
- [ ] User-facing error messages

---

## 6. Troubleshooting

### Issue: "ASAAS_API_KEY não configurada"

**Solution**: Configure environment variable in Railway
```bash
railway variables set ASAAS_API_KEY=your_key
```

### Issue: "Circuit breaker is OPEN"

**Solution**: Reset circuit breaker or wait for timeout
```typescript
client.resetCircuitBreaker()
// Or wait 60 seconds for automatic reset
```

### Issue: Too many retries

**Solution**: Check API key validity and network connectivity
```typescript
const testResult = await client.testConnection()
console.log('Connection test:', testResult)
```

### Issue: Validation errors

**Solution**: Check data format before sending
```typescript
const validated = AsaasCustomerPayloadSchema.parse(payload)
// This will throw with detailed error message if invalid
```

---

## 7. Resources

### Documentation
- [Diagnostic Report](./DIAGNOSTIC_REPORT.md)
- [Security Recommendations](./SECURITY_RECOMMENDATIONS.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

### External Resources
- [Asaas API Documentation](https://docs.asaas.com/reference/introducao)
- [Zod Documentation](https://zod.dev/)
- [Convex Documentation](https://docs.convex.dev/)

---

**Last Updated**: 2025-12-25
**Version**: 1.0
