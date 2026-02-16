# KOSH: Phase 1 Agentic Features

## 1. The "Tax Trap" Agent (Agentic Workflow)
- **Requirement**: The system shall intercept income deposits to enforce tax compliance.
- **Trigger**: User triggers `/api/wallet/topup`.
- **Logic**: 
    - **IF** income is logged, **THE SYSTEM SHALL** calculate a 15% split.
    - **THE SYSTEM SHALL** credit 85% to `walletBalance` and 15% to a new `taxVault` field in `UserModel`.
- **Guardrail**: 
    - **WHEN** a user requests a withdrawal from `taxVault`, **THE SYSTEM SHALL** check the current month.
    - **IF** the current month is NOT April (India Tax Season), **THE SYSTEM SHALL** return a 403 Forbidden error with the message "🔒 ACCESS DENIED. The Tax Agent has locked these funds until Tax Season."

## 2. Dynamic Financial Health Score
- **Requirement**: The system shall provide a gamified financial health indicator.
- **Metric Logic**:
    - **Base Score**: 100.
    - **Deductions**: -10 per late group contribution, -5 if `walletBalance` < $100.
    - **Bonuses**: +10 for maintaining a 3-month saving streak.
- **UI Component**: 
    - **THE SYSTEM SHALL** display a color-coded gauge in the Dashboard:
        - **Green**: 80-100 (Healthy)
        - **Yellow**: 50-79 (Warning)
        - **Red**: < 50 (Critical)

## 3. Multimodal AI Financial Coach (Context-Aware)
- **Service**: Amazon Bedrock (Nova Model).
- **Context Injection**: 
    - **WHEN** a chat session starts, **THE SYSTEM SHALL** fetch user `walletBalance`, `taxVault`, `healthScore`, and `savingsHistory`.
    - **THE SYSTEM SHALL** inject this data into the Bedrock System Prompt.
- **Multimodal Scanning**:
    - **WHEN** an image is uploaded, **THE SYSTEM SHALL** use Bedrock Vision capabilities to categorize line items into "Needs" vs "Wants".
- **Streaming & Voice**:
    - **THE SYSTEM SHALL** stream responses using `ReadableStream`.
    - **THE SYSTEM SHALL** provide a Speech-to-Text interface and a Text-to-Speech output (stripping emojis via regex for audio clarity).