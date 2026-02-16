# Requirements Document: Tax Trap Agent

## Introduction

The Tax Trap Agent is an autonomous financial compliance system designed for gig workers in India. It automatically intercepts income deposits, calculates tax liabilities at 15%, and secures these funds in a protected vault until tax season (April). This system ensures gig workers maintain tax compliance without manual intervention, reducing the risk of tax-related financial stress.

## Glossary

- **Tax_Trap_Agent**: The autonomous system that intercepts income deposits and enforces tax compliance
- **Tax_Vault**: A protected account balance that stores tax liabilities, separate from the main wallet
- **Wallet_Balance**: The main account balance available for user spending and withdrawals
- **Income_Deposit**: Any deposit classified as income (as opposed to transfers or refunds)
- **Tax_Season**: The month of April in India when tax filing and payments are due
- **Health_Score**: A user metric tracking financial compliance and behavior (0-100)
- **Tax_Split**: The automatic division of income into 85% wallet balance and 15% tax vault

## Requirements

### Requirement 1: Income Deposit Interception

**User Story:** As a gig worker, I want my income deposits to be automatically processed for tax compliance, so that I don't have to manually calculate and set aside tax money.

#### Acceptance Criteria

1. WHEN an income deposit is received through the income API endpoint, THE Tax_Trap_Agent SHALL intercept the transaction before crediting the user account
2. WHEN the income amount is validated, THE Tax_Trap_Agent SHALL calculate the tax split as 15% of the total amount
3. WHEN the tax split is calculated, THE Tax_Trap_Agent SHALL compute the net amount as 85% of the total deposit
4. IF the income amount is zero or negative, THEN THE Tax_Trap_Agent SHALL reject the transaction and return an error
5. IF the income amount exceeds the wallet limit after split, THEN THE Tax_Trap_Agent SHALL reject the transaction and return an error

### Requirement 2: Dual Account Crediting

**User Story:** As a gig worker, I want my income to be automatically split between my spending wallet and tax vault, so that my tax obligations are secured without my intervention.

#### Acceptance Criteria

1. WHEN the tax split is calculated, THE Tax_Trap_Agent SHALL credit 85% of the income to the Wallet_Balance
2. WHEN the tax split is calculated, THE Tax_Trap_Agent SHALL credit 15% of the income to the Tax_Vault
3. WHEN both accounts are credited, THE Tax_Trap_Agent SHALL use a database transaction to ensure atomicity
4. IF either account update fails, THEN THE Tax_Trap_Agent SHALL roll back both updates and return an error
5. WHEN the transaction completes successfully, THE Tax_Trap_Agent SHALL return the updated balances for both accounts

### Requirement 3: Tax Vault Protection

**User Story:** As a gig worker, I want my tax funds to be protected from withdrawal until tax season, so that I don't accidentally spend money needed for tax payments.

#### Acceptance Criteria

1. WHEN a user attempts to withdraw from the Tax_Vault, THE Tax_Trap_Agent SHALL check the current month
2. IF the current month is April, THEN THE Tax_Trap_Agent SHALL allow the withdrawal to proceed
3. IF the current month is not April, THEN THE Tax_Trap_Agent SHALL block the withdrawal and return HTTP 403 Forbidden
4. WHEN a withdrawal is blocked, THE Tax_Trap_Agent SHALL return the message "🔒 ACCESS DENIED. The Tax Agent has locked these funds until Tax Season."
5. WHEN Tax_Season ends (May 1st), THE Tax_Trap_Agent SHALL automatically re-lock the Tax_Vault for the next year

### Requirement 4: User Data Model Extension

**User Story:** As a system administrator, I want the user data model to support tax vault and health score tracking, so that the Tax Trap Agent can function properly.

#### Acceptance Criteria

1. THE User_Model SHALL include a taxVault field of type Number with default value 0
2. THE User_Model SHALL include a healthScore field of type Number with default value 100
3. WHEN a new user is created, THE User_Model SHALL initialize taxVault to 0
4. WHEN a new user is created, THE User_Model SHALL initialize healthScore to 100
5. THE User_Model SHALL validate that taxVault is never negative

### Requirement 5: Income Transaction Recording

**User Story:** As a gig worker, I want my income deposits to be recorded with tax split details, so that I can track my income and tax history.

#### Acceptance Criteria

1. WHEN an income deposit is processed, THE Tax_Trap_Agent SHALL create a transaction record
2. THE transaction record SHALL include the total income amount, tax amount, and net amount
3. THE transaction record SHALL include a timestamp and status indicator
4. THE transaction record SHALL be linked to the user's account
5. WHEN the transaction record is created, THE Tax_Trap_Agent SHALL ensure it is part of the same database transaction as the balance updates

### Requirement 6: API Endpoint for Income Deposits

**User Story:** As a system integrator, I want a dedicated API endpoint for income deposits, so that income can be processed differently from other wallet operations.

#### Acceptance Criteria

1. THE System SHALL provide a POST endpoint at /api/wallet/income
2. WHEN the endpoint receives a request, THE System SHALL validate the user is authenticated
3. WHEN the endpoint receives a request, THE System SHALL validate the amount parameter using Zod schema
4. WHEN validation passes, THE System SHALL invoke the Tax_Trap_Agent to process the income
5. WHEN processing completes, THE System SHALL return a JSON response with updated balances and transaction details

### Requirement 7: Withdrawal Endpoint Protection

**User Story:** As a gig worker, I want withdrawal endpoints to respect tax vault protection, so that I cannot accidentally withdraw tax funds outside of tax season.

#### Acceptance Criteria

1. WHEN any withdrawal endpoint is invoked, THE System SHALL check if the withdrawal includes Tax_Vault funds
2. IF Tax_Vault funds are included in the withdrawal, THE System SHALL invoke the Tax_Trap_Agent guardrail check
3. WHEN the guardrail check fails, THE System SHALL return HTTP 403 with the appropriate error message
4. WHEN the guardrail check passes, THE System SHALL allow the withdrawal to proceed
5. THE System SHALL apply this protection to all existing and future withdrawal endpoints

### Requirement 8: Transaction Atomicity

**User Story:** As a system administrator, I want all tax-related operations to be atomic, so that the system maintains data consistency even during failures.

#### Acceptance Criteria

1. WHEN processing an income deposit, THE Tax_Trap_Agent SHALL use MongoDB transactions
2. WHEN updating Wallet_Balance and Tax_Vault, THE Tax_Trap_Agent SHALL ensure both updates succeed or both fail
3. WHEN creating transaction records, THE Tax_Trap_Agent SHALL include them in the same transaction as balance updates
4. IF any operation in the transaction fails, THEN THE Tax_Trap_Agent SHALL roll back all changes
5. WHEN a rollback occurs, THE Tax_Trap_Agent SHALL return a descriptive error message to the user

### Requirement 9: Input Validation and Error Handling

**User Story:** As a gig worker, I want clear error messages when my income deposit fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN the income amount is missing or invalid, THE System SHALL return HTTP 400 with a descriptive error message
2. WHEN the user is not authenticated, THE System SHALL return HTTP 401 with an authentication error
3. WHEN the wallet limit would be exceeded, THE System SHALL return HTTP 400 with a limit exceeded message
4. WHEN a database error occurs, THE System SHALL return HTTP 500 with a generic error message
5. WHEN validation fails, THE System SHALL include the specific validation errors in the response

### Requirement 10: Health Score Integration (Future)

**User Story:** As a gig worker, I want my financial compliance to be tracked via a health score, so that I can build trust and access better financial products.

#### Acceptance Criteria

1. THE User_Model SHALL include a healthScore field for future health score calculations
2. WHEN a user successfully completes a tax payment in April, THE System SHALL have the capability to update the healthScore
3. THE healthScore SHALL be readable via the user profile API
4. THE healthScore SHALL be initialized to 100 for all new users
5. THE System SHALL reserve the healthScore field for future autonomous agent integration
