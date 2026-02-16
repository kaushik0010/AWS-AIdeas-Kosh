import { checkTaxVaultAccess, TaxVaultAccessResult } from "../services/taxTrapAgent.service";

/**
 * Tax Vault Guardrail Middleware
 * Enforces tax vault access control by checking if withdrawals are allowed
 * Only permits access during April (India Tax Season)
 * 
 * @returns TaxVaultAccessResult with allowed flag and optional message
 * 
 * Usage in withdrawal endpoints:
 * ```typescript
 * const accessCheck = enforceTaxVaultGuardrail();
 * if (!accessCheck.allowed) {
 *     return NextResponse.json(
 *         { success: false, message: accessCheck.message },
 *         { status: 403 }
 *     );
 * }
 * ```
 */
export function enforceTaxVaultGuardrail(): TaxVaultAccessResult {
    return checkTaxVaultAccess();
}
