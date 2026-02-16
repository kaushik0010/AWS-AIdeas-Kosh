# Implementation Plan: Tax Trap Agent

## Overview

This implementation plan breaks down the Tax Trap Agent feature into discrete, incremental coding tasks. Each task builds on previous work, with property-based tests integrated close to implementation to catch errors early. The plan follows a bottom-up approach: data models → services → API endpoints → integration.

## Tasks

- [x] 1. Update User model with tax vault and health score fields
  - Extend the User interface in `src/features/auth/models/user.model.ts`
  - Add `taxVault` field (Number, default: 0, min: 0)
  - Add `healthScore` field (Number, default: 100, min: 0, max: 100)
  - Add validation constraints to prevent negative tax vault values
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 1.1 Write unit tests for User model defaults
  - Test that new users have taxVault initialized to 0
  - Test that new users have healthScore initialized to 100
  - _Requirements: 4.3, 4.4_

- [ ]* 1.2 Write property test for tax vault non-negativity
  - **Property 5: Tax Vault Non-Negativity**
  - **Validates: Requirements 4.5**
  - Generate random negative numbers and verify they are rejected
  - _Requirements: 4.5_

- [x] 2. Create Income Transaction model
  - Create new file `src/features/savings/individual/models/incomeTransaction.model.ts`
  - Define IncomeTransaction interface with userId, totalAmount, taxAmount, netAmount, date, status, metadata
  - Create Mongoose schema with validation and indexes
  - Add indexes on userId and date for query performance
  - Export IncomeTransactionModel
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 2.1 Write property test for transaction record completeness
  - **Property 6: Transaction Record Completeness**
  - **Validates: Requirements 5.1, 5.2**
  - Generate random valid income amounts
  - Verify transaction records contain all required fields
  - _Requirements: 5.1, 5.2_

- [x] 3. Implement Tax Trap Agent service core functions
  - [x] 3.1 Create service file and tax split calculator
    - Create `src/features/tax/services/taxTrapAgent.service.ts`
    - Implement `calculateTaxSplit(amount: number): TaxSplitResult`
    - Calculate 15% tax amount and 85% net amount
    - _Requirements: 1.2, 1.3_

  - [ ]* 3.2 Write property test for tax split calculation
    - **Property 1: Tax Split Calculation Accuracy**
    - **Validates: Requirements 1.2, 1.3, 2.1, 2.2**
    - Generate random positive amounts (0.01 to 100,000)
    - Verify 15% goes to tax vault, 85% to wallet, sum equals original
    - _Requirements: 1.2, 1.3_

  - [x] 3.3 Implement income deposit processor with transactions
    - Implement `processIncomeDeposit(userId: string, amount: number): Promise<IncomeProcessingResult>`
    - Use MongoDB session and transaction for atomicity
    - Validate amount is positive
    - Calculate tax split
    - Update user walletBalance and taxVault
    - Create IncomeTransaction record
    - Handle wallet limit validation ($10,000)
    - Implement rollback on any error
    - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 3.4 Write property test for invalid amount rejection
    - **Property 2: Invalid Amount Rejection**
    - **Validates: Requirements 1.4, 1.5**
    - Generate zero, negative, and limit-exceeding amounts
    - Verify transactions are rejected without modifying balances
    - _Requirements: 1.4, 1.5_

  - [ ]* 3.5 Write property test for transaction atomicity
    - **Property 3: Transaction Atomicity**
    - **Validates: Requirements 2.4, 8.2, 8.3, 8.4**
    - Simulate failure scenarios during processing
    - Verify all changes are rolled back on any failure
    - _Requirements: 2.4, 8.2, 8.3, 8.4_

  - [x] 3.6 Implement tax vault access control
    - Implement `checkTaxVaultAccess(): TaxVaultAccessResult`
    - Check if current month is April (month === 3)
    - Return allowed: true if April, otherwise return 403 message
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.7 Write property test for tax vault access control
    - **Property 4: Tax Vault Access Control**
    - **Validates: Requirements 3.3**
    - Generate random non-April months (0-2, 4-11)
    - Verify withdrawals are blocked with HTTP 403
    - _Requirements: 3.3_

  - [ ]* 3.8 Write unit test for April access
    - Test that withdrawals in April are allowed
    - Test April 1st and April 30th specifically
    - Test May 1st is blocked
    - _Requirements: 3.2, 3.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create income API endpoint
  - [x] 5.1 Create income endpoint route file
    - Create `app/api/wallet/income/route.ts`
    - Set up database connection and authentication check
    - _Requirements: 6.1, 6.2_

  - [x] 5.2 Implement request validation with Zod
    - Create Zod schema for income deposit (amount: positive number, max 100,000)
    - Validate request body against schema
    - Return 400 with validation errors if invalid
    - _Requirements: 6.3, 9.1, 9.5_

  - [x] 5.3 Implement POST handler
    - Authenticate user with getServerSession
    - Parse and validate request body
    - Find user by email
    - Call processIncomeDeposit from Tax Trap Agent service
    - Return success response with updated balances and transaction details
    - Handle all error cases (401, 404, 400, 500)
    - _Requirements: 6.4, 6.5, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 5.4 Write integration tests for income endpoint
    - Test successful income deposit flow
    - Test unauthenticated request returns 401
    - Test invalid amount returns 400
    - Test wallet limit exceeded returns 400
    - Test response includes updated balances
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Create tax vault guardrail middleware
  - Create `src/features/tax/middleware/taxVaultGuardrail.ts`
  - Export `enforceTaxVaultGuardrail()` function
  - Function calls `checkTaxVaultAccess()` from service
  - Returns access result for use in withdrawal endpoints
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 6.1 Write unit tests for guardrail middleware
  - Test that middleware correctly calls access check
  - Test that 403 is returned when access denied
  - Test that access is allowed in April
  - _Requirements: 7.3, 7.4_

- [x] 7. Update user profile API to include new fields
  - Update `app/api/user/me/route.ts` to select taxVault and healthScore
  - Return taxVault and healthScore in response
  - _Requirements: 10.3_

- [ ]* 7.1 Write unit test for profile API
  - Test that taxVault is included in profile response
  - Test that healthScore is included in profile response
  - _Requirements: 10.3_

- [ ] 8. Final checkpoint - Ensure all tests pass
  - Run full test suite (unit + property tests)
  - Verify all 6 correctness properties are tested
  - Ensure test coverage meets goals (90%+ line coverage)
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each property test should run minimum 100 iterations
- All database operations use MongoDB transactions for atomicity
- Property tests use fast-check library for TypeScript
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of functionality
