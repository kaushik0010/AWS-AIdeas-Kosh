# Design Document: Tax Trap Agent

## Overview

The Tax Trap Agent is an autonomous financial compliance system that intercepts income deposits for gig workers in India and automatically enforces a 15% tax withholding. The system operates as a middleware layer between income receipt and account crediting, ensuring tax compliance without user intervention.

The design follows a transaction-based approach using MongoDB sessions to guarantee atomicity across multiple database operations. The agent implements a time-based guardrail that prevents tax vault withdrawals outside of April (India's tax season), providing a "set it and forget it" tax compliance solution.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              API Layer (Next.js App Router)                  │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │ /api/wallet/     │         │ /api/wallet/            │  │
│  │ income           │         │ withdraw (future)       │  │
│  └────────┬─────────┘         └──────────┬──────────────┘  │
└───────────┼────────────────────────────────┼─────────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Tax Trap Agent Service                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  processIncomeDeposit()                              │  │
│  │  - Calculate 15% tax split                           │  │
│  │  - Update walletBalance (85%)                        │  │
│  │  - Update taxVault (15%)                             │  │
│  │  - Create transaction record                         │  │
│  │  - Use MongoDB transaction for atomicity             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  checkTaxVaultAccess()                               │  │
│  │  - Check if current month is April                   │  │
│  │  - Return 403 if not April                           │  │
│  │  - Allow access if April                             │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────┼────────────────────────────────┼─────────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Mongoose)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ User Model   │  │ Income       │  │ WalletTopUp     │  │
│  │ - taxVault   │  │ Transaction  │  │ Model           │  │
│  │ - healthScore│  │ Model        │  │ (existing)      │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└───────────┼────────────────────────────────┼─────────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Database                        │
└─────────────────────────────────────────────────────────────┘
```

### Design Decisions

1. **Separate Income Endpoint**: Create `/api/wallet/income` instead of modifying existing `/api/user/update` to maintain clear separation of concerns and allow different business logic for income vs. other wallet operations.

2. **MongoDB Transactions**: Use Mongoose sessions with transactions to ensure atomicity. If any operation fails (wallet update, tax vault update, or transaction record creation), all changes are rolled back.

3. **Time-Based Guardrail**: Implement month-based checking (April = tax season) rather than date ranges to simplify logic and align with India's tax filing period.

4. **New Transaction Model**: Create a dedicated `IncomeTransaction` model separate from `WalletTopUp` to track tax splits and provide audit trail for tax compliance.

5. **Health Score Placeholder**: Include `healthScore` field in User model for future autonomous agent integration, initialized to 100 but not actively used in this phase.

## Components and Interfaces

### 1. Updated User Model

**File**: `src/features/auth/models/user.model.ts`

**Interface Extension**:
```typescript
export interface User extends Document {
    name: string;
    email: string;
    password: string;
    verificationToken: string;
    verificationTokenExpiry: Date;
    isEmailVerified: boolean;
    walletBalance: number;
    taxVault: number;        // NEW: Tax withholding balance
    healthScore: number;     // NEW: Financial compliance score (0-100)
    createdAt: Date;
    updatedAt: Date;
}
```

**Schema Updates**:
```typescript
taxVault: {
    type: Number,
    default: 0,
    min: [0, "Tax vault cannot be negative"]
},
healthScore: {
    type: Number,
    default: 100,
    min: [0, "Health score cannot be negative"],
    max: [100, "Health score cannot exceed 100"]
}
```

### 2. Income Transaction Model

**File**: `src/features/savings/individual/models/incomeTransaction.model.ts`

**Interface**:
```typescript
export interface IncomeTransaction extends Document {
    userId: Types.ObjectId;
    totalAmount: number;      // Original income amount
    taxAmount: number;        // 15% withheld for taxes
    netAmount: number;        // 85% credited to wallet
    date: Date;
    status: "success" | "failed";
    metadata?: {
        source?: string;      // Future: track income source
        description?: string;
    };
}
```

**Schema**:
```typescript
const incomeTransactionSchema = new Schema<IncomeTransaction>({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true
    },
    totalAmount: { 
        type: Number, 
        required: true,
        min: [0, "Amount must be positive"]
    },
    taxAmount: { 
        type: Number, 
        required: true,
        min: [0, "Tax amount must be positive"]
    },
    netAmount: { 
        type: Number, 
        required: true,
        min: [0, "Net amount must be positive"]
    },
    date: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    status: { 
        type: String, 
        enum: ["success", "failed"], 
        default: "success" 
    },
    metadata: {
        source: String,
        description: String
    }
});
```

### 3. Tax Trap Agent Service

**File**: `src/features/tax/services/taxTrapAgent.service.ts`

**Interface**:
```typescript
export interface TaxSplitResult {
    taxAmount: number;
    netAmount: number;
}

export interface IncomeProcessingResult {
    success: boolean;
    walletBalance: number;
    taxVault: number;
    transaction?: IncomeTransaction;
    error?: string;
}

export interface TaxVaultAccessResult {
    allowed: boolean;
    message?: string;
}
```

**Core Functions**:

```typescript
// Calculate 15% tax split
function calculateTaxSplit(amount: number): TaxSplitResult {
    const taxAmount = amount * 0.15;
    const netAmount = amount * 0.85;
    return { taxAmount, netAmount };
}

// Process income deposit with transaction
async function processIncomeDeposit(
    userId: string, 
    amount: number
): Promise<IncomeProcessingResult> {
    // 1. Start MongoDB session
    // 2. Calculate tax split
    // 3. Update user.walletBalance (add netAmount)
    // 4. Update user.taxVault (add taxAmount)
    // 5. Create IncomeTransaction record
    // 6. Commit transaction
    // 7. Return updated balances
    // On error: rollback and return error
}

// Check if tax vault access is allowed
function checkTaxVaultAccess(): TaxVaultAccessResult {
    const currentMonth = new Date().getMonth(); // 0-11
    const isApril = currentMonth === 3; // April = 3
    
    if (isApril) {
        return { allowed: true };
    }
    
    return { 
        allowed: false, 
        message: "🔒 ACCESS DENIED. The Tax Agent has locked these funds until Tax Season."
    };
}
```

**Implementation Details**:

```typescript
async function processIncomeDeposit(
    userId: string, 
    amount: number
): Promise<IncomeProcessingResult> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Validate amount
        if (amount <= 0) {
            throw new Error("Amount must be positive");
        }
        
        // Calculate split
        const { taxAmount, netAmount } = calculateTaxSplit(amount);
        
        // Find user
        const user = await UserModel.findById(userId).session(session);
        if (!user) {
            throw new Error("User not found");
        }
        
        // Check wallet limit
        const newWalletBalance = user.walletBalance + netAmount;
        if (newWalletBalance > 10000) {
            throw new Error("Wallet limit exceeded ($10,000)");
        }
        
        // Update balances
        user.walletBalance = newWalletBalance;
        user.taxVault += taxAmount;
        await user.save({ session });
        
        // Create transaction record
        const transaction = await IncomeTransactionModel.create([{
            userId: user._id,
            totalAmount: amount,
            taxAmount,
            netAmount,
            status: "success",
            date: new Date()
        }], { session });
        
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        
        return {
            success: true,
            walletBalance: user.walletBalance,
            taxVault: user.taxVault,
            transaction: transaction[0]
        };
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        return {
            success: false,
            walletBalance: 0,
            taxVault: 0,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}
```

### 4. Income API Endpoint

**File**: `app/api/wallet/income/route.ts`

**Request Validation Schema**:
```typescript
import { z } from "zod";

const incomeDepositSchema = z.object({
    amount: z.number()
        .positive("Amount must be positive")
        .max(100000, "Amount exceeds maximum limit")
});
```

**Endpoint Implementation**:
```typescript
export async function POST(request: Request) {
    await dbConnect();
    
    try {
        // 1. Authenticate user
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }
        
        // 2. Parse and validate request
        const body = await request.json();
        const validation = incomeDepositSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Invalid input",
                    errors: validation.error.errors
                },
                { status: 400 }
            );
        }
        
        // 3. Get user
        const user = await UserModel.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }
        
        // 4. Process income through Tax Trap Agent
        const result = await processIncomeDeposit(
            user._id.toString(), 
            validation.data.amount
        );
        
        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.error },
                { status: 400 }
            );
        }
        
        // 5. Return success response
        return NextResponse.json({
            success: true,
            message: "Income processed successfully",
            data: {
                walletBalance: result.walletBalance,
                taxVault: result.taxVault,
                transaction: {
                    totalAmount: result.transaction?.totalAmount,
                    taxAmount: result.transaction?.taxAmount,
                    netAmount: result.transaction?.netAmount,
                    date: result.transaction?.date
                }
            }
        }, { status: 200 });
        
    } catch (error) {
        console.error("Income processing error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
```

### 5. Tax Vault Guardrail Middleware

**File**: `src/features/tax/middleware/taxVaultGuardrail.ts`

**Purpose**: Reusable function to check tax vault access in withdrawal endpoints

```typescript
export function enforceTaxVaultGuardrail(): TaxVaultAccessResult {
    return checkTaxVaultAccess();
}

// Usage in withdrawal endpoints:
export async function POST(request: Request) {
    // ... authentication and validation ...
    
    // Check if withdrawal includes tax vault funds
    const { withdrawFromTaxVault } = await request.json();
    
    if (withdrawFromTaxVault) {
        const accessCheck = enforceTaxVaultGuardrail();
        
        if (!accessCheck.allowed) {
            return NextResponse.json(
                { success: false, message: accessCheck.message },
                { status: 403 }
            );
        }
    }
    
    // ... proceed with withdrawal ...
}
```

## Data Models

### User Model Updates

**Current State**:
- `walletBalance`: Main spending balance

**New State**:
- `walletBalance`: Main spending balance (receives 85% of income)
- `taxVault`: Protected tax balance (receives 15% of income)
- `healthScore`: Financial compliance metric (0-100, default 100)

**Constraints**:
- `taxVault >= 0` (cannot be negative)
- `healthScore` range: 0-100
- `walletBalance` limit: $10,000 (existing constraint)

### Income Transaction Model

**Purpose**: Audit trail for all income deposits and tax splits

**Fields**:
- `userId`: Reference to User
- `totalAmount`: Original income amount
- `taxAmount`: Amount allocated to tax vault (15%)
- `netAmount`: Amount credited to wallet (85%)
- `date`: Transaction timestamp
- `status`: "success" | "failed"
- `metadata`: Optional source and description

**Indexes**:
- `userId` (for user transaction history queries)
- `date` (for time-based queries and reporting)

### Relationship Diagram

```
User (1) ──────< (many) IncomeTransaction
  │
  ├─ walletBalance (85% of income)
  ├─ taxVault (15% of income)
  └─ healthScore (future use)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Tax Split Calculation Accuracy

*For any* positive income amount, when processed by the Tax Trap Agent, exactly 15% should be allocated to the tax vault and exactly 85% should be allocated to the wallet balance, with the sum of both allocations equaling the original amount.

**Validates: Requirements 1.2, 1.3, 2.1, 2.2**

### Property 2: Invalid Amount Rejection

*For any* income amount that is zero, negative, or would cause the wallet balance to exceed the $10,000 limit, the Tax Trap Agent should reject the transaction and return an error without modifying any account balances.

**Validates: Requirements 1.4, 1.5**

### Property 3: Transaction Atomicity

*For any* income deposit operation, if any part of the operation fails (wallet update, tax vault update, or transaction record creation), then all changes should be rolled back and no account balances or records should be modified.

**Validates: Requirements 2.4, 8.2, 8.3, 8.4**

### Property 4: Tax Vault Access Control

*For any* month that is not April (months 0-2, 4-11 in JavaScript Date), any attempt to withdraw from the tax vault should be blocked and return HTTP 403 with the access denied message.

**Validates: Requirements 3.3**

### Property 5: Tax Vault Non-Negativity

*For any* operation that attempts to set the tax vault balance to a negative value, the operation should be rejected by the database validation.

**Validates: Requirements 4.5**

### Property 6: Transaction Record Completeness

*For any* successful income deposit, a transaction record should be created that includes the userId, totalAmount, taxAmount (15%), netAmount (85%), timestamp, and status, with all fields properly populated.

**Validates: Requirements 5.1, 5.2**

## Error Handling

### Error Categories

1. **Authentication Errors (401)**
   - User not authenticated
   - Invalid or expired session
   - Response: `{ success: false, message: "Unauthorized" }`

2. **Validation Errors (400)**
   - Missing or invalid amount
   - Zero or negative amount
   - Amount exceeds maximum limit
   - Wallet limit would be exceeded
   - Response: `{ success: false, message: "...", errors: [...] }`

3. **Authorization Errors (403)**
   - Tax vault withdrawal attempted outside April
   - Response: `{ success: false, message: "🔒 ACCESS DENIED. The Tax Agent has locked these funds until Tax Season." }`

4. **Not Found Errors (404)**
   - User not found
   - Response: `{ success: false, message: "User not found" }`

5. **Server Errors (500)**
   - Database connection failure
   - Transaction rollback due to unexpected error
   - Response: `{ success: false, message: "Internal server error" }`

### Error Handling Strategy

1. **Input Validation**: Use Zod schemas to validate all inputs before processing
2. **Transaction Rollback**: Wrap all database operations in MongoDB transactions with automatic rollback on error
3. **Logging**: Log all errors with context for debugging (user ID, amount, error details)
4. **User-Friendly Messages**: Return clear, actionable error messages to users
5. **Security**: Don't expose internal implementation details in error messages

### Rollback Scenarios

```typescript
// Scenario 1: Wallet limit exceeded
try {
    if (newWalletBalance > 10000) {
        throw new Error("Wallet limit exceeded");
    }
    // ... continue processing
} catch (error) {
    await session.abortTransaction();
    // All changes rolled back
}

// Scenario 2: Database constraint violation
try {
    user.taxVault = -100; // Violates min: 0 constraint
    await user.save({ session });
} catch (error) {
    await session.abortTransaction();
    // All changes rolled back
}

// Scenario 3: Transaction record creation fails
try {
    await user.save({ session });
    await IncomeTransactionModel.create([...], { session }); // Fails
} catch (error) {
    await session.abortTransaction();
    // User balance changes rolled back
}
```

## Testing Strategy

### Dual Testing Approach

The Tax Trap Agent requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library**: fast-check (TypeScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure comprehensive input coverage through randomization.

**Test Tagging**: Each property-based test must include a comment referencing the design document property:
```typescript
// Feature: tax-trap-agent, Property 1: Tax Split Calculation Accuracy
```

### Property Test Specifications

#### Property 1: Tax Split Calculation Accuracy
- **Generator**: Random positive numbers between 0.01 and 100,000
- **Test**: For each generated amount, verify:
  - `taxAmount === amount * 0.15` (within floating point precision)
  - `netAmount === amount * 0.85` (within floating point precision)
  - `taxAmount + netAmount === amount` (within floating point precision)
- **Iterations**: 100+

#### Property 2: Invalid Amount Rejection
- **Generator**: Random zero, negative, and limit-exceeding amounts
- **Test**: For each generated invalid amount, verify:
  - Transaction is rejected
  - Error message is returned
  - No account balances are modified
- **Iterations**: 100+

#### Property 3: Transaction Atomicity
- **Generator**: Random valid amounts with simulated failure points
- **Test**: For each generated scenario, verify:
  - If any operation fails, all changes are rolled back
  - Account balances remain unchanged after rollback
  - No transaction records are created after rollback
- **Iterations**: 100+

#### Property 4: Tax Vault Access Control
- **Generator**: Random months (0-11) excluding April (3)
- **Test**: For each generated non-April month, verify:
  - Withdrawal attempt returns HTTP 403
  - Error message matches expected format
  - Tax vault balance remains unchanged
- **Iterations**: 100+

#### Property 5: Tax Vault Non-Negativity
- **Generator**: Random negative numbers
- **Test**: For each generated negative value, verify:
  - Attempt to set tax vault is rejected
  - Database validation error is thrown
  - Tax vault balance remains unchanged
- **Iterations**: 100+

#### Property 6: Transaction Record Completeness
- **Generator**: Random valid income amounts
- **Test**: For each generated amount, verify:
  - Transaction record is created
  - All required fields are present (userId, totalAmount, taxAmount, netAmount, date, status)
  - Field values match expected calculations
- **Iterations**: 100+

### Unit Test Specifications

Unit tests should focus on specific examples and integration points:

1. **Specific Amount Examples**
   - Test with $1000 income → $850 wallet, $150 tax vault
   - Test with $100 income → $85 wallet, $15 tax vault
   - Test with $0.01 income → verify rounding behavior

2. **Edge Cases**
   - Test with amount that brings wallet to exactly $10,000 limit
   - Test with amount that would exceed limit by $0.01
   - Test with very large amounts (e.g., $99,999)

3. **April Access Control**
   - Test withdrawal in April → should succeed
   - Test withdrawal on April 1st → should succeed
   - Test withdrawal on April 30th → should succeed
   - Test withdrawal on May 1st → should fail

4. **Error Conditions**
   - Test with unauthenticated user → 401 error
   - Test with non-existent user → 404 error
   - Test with malformed request body → 400 error

5. **Integration Tests**
   - Test full API flow: POST /api/wallet/income → verify response
   - Test transaction record creation → verify database state
   - Test concurrent income deposits → verify no race conditions

### Test Coverage Goals

- **Line Coverage**: 90%+
- **Branch Coverage**: 85%+
- **Property Coverage**: 100% (all 6 properties tested)
- **Critical Path Coverage**: 100% (all success and error paths tested)

### Testing Tools

- **Unit Testing**: Jest or Vitest
- **Property Testing**: fast-check
- **API Testing**: Supertest or Next.js API testing utilities
- **Database Testing**: MongoDB Memory Server for isolated tests
- **Mocking**: Jest mocks for external dependencies

### Test Execution

```bash
# Run all tests
pnpm test

# Run property tests only
pnpm test:property

# Run unit tests only
pnpm test:unit

# Run with coverage
pnpm test:coverage
```
