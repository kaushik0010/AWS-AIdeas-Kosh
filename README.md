# KOSH (कोश) - Agentic Financial Wellness Platform

> **कोश** (Kosh) means "treasury" or "vault" in Sanskrit — a fitting name for a platform that helps Indian gig workers build financial resilience through intelligent automation and community savings.

## 🎯 Project Vision

KOSH is an **Agentic AI FinTech platform** built for the **modern independent workforce**. While open to all, KOSH is specifically optimized for the unique challenges of **India’s 15 million+ gig workers and freelancers** who lack formal tax withholding and stable savings structures. Unlike traditional savings apps, KOSH acts as an autonomous financial guardian that:

- **Automatically secures tax liabilities** before users can spend their income
- **Provides context-aware financial coaching** using multimodal AI (text + vision)
- **Enables community-based savings** inspired by traditional Indian chit-fund systems
- **Gamifies financial health** through real-time scoring and behavioral nudges

The platform transitions from passive financial tracking to an **autonomous financial ecosystem** where AI agents work proactively to protect users from common financial pitfalls.

---

## 🚀 Core Features

### 1. Tax Trap Agent (Automated Tax Compliance)

The Tax Trap Agent is an autonomous workflow that intercepts income deposits and enforces tax discipline.

#### How It Works

**Trigger**: User deposits income via `/api/wallet/income`

**Automatic Split Logic**:
```typescript
// 15% → Tax Vault (locked until April)
// 85% → Wallet Balance (available immediately)

const taxAmount = income * 0.15;
const netAmount = income * 0.85;
```

**April Guardrail**:
- Tax Vault funds are **locked** for 11 months of the year
- Withdrawal attempts return: `🔒 ACCESS DENIED. The Tax Agent has locked these funds until Tax Season.`
- Funds unlock **only in April** (India's tax filing season)

**Technical Implementation**:
- Uses **MongoDB atomic transactions** to ensure split consistency
- Creates audit trail via `IncomeTransactionModel`
- Enforces wallet limit of ₹10,00,000 (10 Lakhs INR)

**User Model Schema**:
```typescript
{
  walletBalance: Number,  // 85% of income
  taxVault: Number,       // 15% of income (locked)
  healthScore: Number     // 0-100 gamification metric
}
```

---

### 2. AI Financial Coach (Multimodal Nova Pro Integration)

A context-aware AI assistant powered by **Amazon Bedrock Nova Pro** that provides personalized financial guidance.

#### Key Capabilities

**Context Injection**:
- Fetches user's `walletBalance`, `taxVault`, `healthScore`, and recent transaction history
- Injects real-time financial data into system prompt for personalized advice

**Multimodal Receipt Scanning (OCR)**:
- Users upload receipt images via paperclip button
- Nova Pro Vision API extracts merchant name, line items, and total amount
- Categorizes expenses into **NEEDS** (groceries, medicine, utilities) vs **WANTS** (dining out, entertainment)

**Anti-Hallucination Protocol**:
```typescript
// Strict vision rules to prevent AI from inventing data
"CRITICAL: If an image is present, your ONLY source of truth is the PIXELS.
DO NOT use generic items like 'Rice' or 'Milk' unless those EXACT words appear.
If you cannot read the text, say: 'I can see the image but the text is too blurry.'"
```

**Plain Text Formatting**:
- No Markdown bolding (`**`), italics (`_`), or headers (`#`)
- Optimized for floating chat bubble UI
- Responses limited to 150 words for mobile readability

**Health Score Logic**:
- **Base Score**: 100
- **Deductions**: -10 per late group contribution, -5 if wallet < ₹100
- **Bonuses**: +10 for 3-month saving streak
- **Color Coding**: 
  - 🟢 Green (80-100): Healthy
  - 🟡 Yellow (50-79): Warning
  - 🔴 Red (<50): Critical

---

### 3. Hybrid Savings System

KOSH offers two savings modes tailored to different user needs.

#### A. Personal Savings Plans

**Regular Savings**:
- Fixed monthly contributions
- Goal-based (e.g., "Emergency Fund", "Vacation")
- Automated reminders on savings day

**Flexible Savings**:
- Variable contribution amounts
- Custom frequency (weekly, bi-weekly, monthly)
- Ideal for irregular gig income

#### B. Group Savings (Chit-Fund Style)

Inspired by traditional Indian **chit funds** and **ROSCAs** (Rotating Savings and Credit Associations), KOSH enables community-based savings with modern governance.

**Campaign Structure**:
- **Admin** creates a campaign with:
  - Monthly contribution amount (e.g., ₹5,000)
  - Duration (e.g., 12 months)
  - Savings day (e.g., 5th of each month)
  - Penalty amount for late payments (e.g., ₹200)
- **Members** join and commit to monthly contributions

**Contribution Ledger** (Persistent Side-by-Side View):
- Real-time tracking of all member payments
- Monthly accordion breakdown showing:
  - 🟢 **Paid**: ₹[amount] with timestamp
  - 🔴 **Late**: Past savings day, penalty applied
  - ⚪ **Pending**: Before savings day deadline

**Automated Penalty System**:
```typescript
// Late payment calculation
const isLate = currentDay > savingsDay;
const totalAmount = baseAmount + (isLate ? penaltyAmount : 0);
```

**Penalty Redistribution Formula** (Group Success Model):
```typescript
// Penalties are redistributed equally among ALL participants
// This incentivizes collective accountability and group cohesion
const penaltyPool = contributions
  .filter(c => c.isLate && c.status === 'paid')
  .reduce((sum, c) => sum + c.penaltyApplied, 0);

const totalParticipants = campaign.participants.length;
const bonusPerMember = Math.floor(penaltyPool / totalParticipants);

// Final payout = base contributions + equal bonus share
for (const member of campaign.participants) {
  member.payout = member.totalContributions + bonusPerMember;
}
```

**Admin-Triggered Payout**:
- Only **group admin** can trigger distribution
- Requires campaign end date to have passed
- Uses **MongoDB transactions** for atomic wallet updates
- Records distribution details:
  ```typescript
  {
    distributedAt: Date,
    payoutPerUser: { [userId]: amount },
    penaltyRedistributed: { [userId]: bonusAmount }
  }
  ```

---

## 🏗️ Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | NextAuth.js v4 |
| **AI Services** | Amazon Bedrock (Nova Pro) |
| **UI Components** | shadcn/ui (Radix UI) |
| **Styling** | Tailwind CSS 4 |
| **Validation** | Zod |
| **Package Manager** | pnpm |

### Key Architectural Decisions

**1. Atomic MongoDB Transactions (Critical for Communal Money Handling)**

KOSH handles communal money in group savings campaigns, making transaction atomicity essential for reliability and trust. All financial operations use MongoDB sessions to ensure consistency:

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Update user balances
  user.walletBalance += netAmount;
  user.taxVault += taxAmount;
  await user.save({ session });

  // Create transaction record
  await IncomeTransactionModel.create([{ ... }], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  // All changes rolled back - no partial updates
}
```

**Why This Matters**:
- **Group Payouts**: When distributing ₹50,000 among 10 members, either all 10 wallets update successfully or none do
- **Tax Splits**: Income deposits must update both `walletBalance` and `taxVault` atomically
- **Contribution Records**: Payment processing creates contribution records and updates campaign totals in a single atomic operation
- **Zero Data Corruption**: Network failures or server crashes cannot leave the system in an inconsistent state

**2. Nova Pro Vision Protocol**
- Model: `us.amazon.nova-pro-v1:0` (upgraded from Nova Lite for better OCR accuracy)
- Strict anti-hallucination rules in system prompt
- Pixel-level verification before categorizing expenses
- Fallback message if text is unreadable

**3. Next.js 15 App Router Patterns**
- Server Components for data fetching
- Server Actions for mutations
- Route Handlers for API endpoints
- Streaming responses for AI chat

**4. Real-Time UI Updates**
- Optimistic UI updates with `router.refresh()`
- Toast notifications via Sonner
- Loading states with Lucide icons

---

## 👥 User Roles & Permissions

### Group Admin

**Capabilities**:
- ✅ Create new savings campaigns
- ✅ Set contribution amounts and penalties
- ✅ Approve/reject join requests (for private groups)
- ✅ Trigger final payout distribution
- ✅ View contribution ledger for all members
- ✅ Update group settings (name, description, criteria)
- ✅ Delete group (if no active campaign)

**Restrictions**:
- ❌ Cannot distribute funds before campaign end date
- ❌ Cannot modify campaign parameters after creation
- ❌ Cannot force members to pay (voluntary system)

### Group Member

**Capabilities**:
- ✅ Join public groups (instant)
- ✅ Request to join private groups (requires admin approval)
- ✅ Pay monthly contributions
- ✅ View own payment history
- ✅ View contribution ledger for all members
- ✅ Leave group (if no active campaign participation)

**Restrictions**:
- ❌ Cannot create campaigns (admin-only)
- ❌ Cannot trigger payouts
- ❌ Cannot modify group settings
- ❌ Cannot view other members' wallet balances

---

## 📊 Business Logic Deep Dive

### Penalty Redistribution Example (Group Success Model)

**Scenario**: 5-member group, ₹5,000/month, ₹200 penalty, 6-month campaign

**Month 1 Contributions**:
| Member | Status | Amount Paid | Penalty |
|--------|--------|-------------|---------|
| Alice | On-time | ₹5,000 | ₹0 |
| Bob | On-time | ₹5,000 | ₹0 |
| Charlie | Late | ₹5,200 | ₹200 |
| Diana | On-time | ₹5,000 | ₹0 |
| Eve | Late | ₹5,200 | ₹200 |

**Penalty Pool**: ₹200 + ₹200 = ₹400

**Total Participants**: 5 members

**Bonus Per Member**: ₹400 ÷ 5 = ₹80 (distributed equally to ALL members)

**Final Payouts** (after 6 months):
| Member | Base Contributions | Bonus | Final Payout |
|--------|-------------------|-------|--------------|
| Alice | ₹30,000 | ₹80 | ₹30,080 |
| Bob | ₹30,000 | ₹80 | ₹30,080 |
| Charlie | ₹30,000 | ₹80 | ₹30,080 |
| Diana | ₹30,000 | ₹80 | ₹30,080 |
| Eve | ₹30,000 | ₹80 | ₹30,080 |

**Key Insight**: Penalties are **not deducted** from late payers' final payout. Instead, they're **redistributed equally among ALL participants** to foster collective accountability and group cohesion. This "Group Success" model ensures everyone benefits when the campaign completes, regardless of individual payment timing.

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+
- MongoDB 6+ (local or Atlas)
- AWS Account with Bedrock access

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/kosh.git
cd kosh
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Environment Variables

Create `.env.local` in the root directory:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/kosh
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kosh

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl

# AWS Bedrock
BEDROCK_API_KEY=your-aws-access-key-id
AWS_REGION=us-east-1

# Email (for verification codes)
RESEND_API_KEY=your-resend-api-key
```

**Required Variables**:
- `MONGODB_URI`: MongoDB connection string (local or Atlas)
- `NEXTAUTH_SECRET`: Secret key for NextAuth session encryption
- `BEDROCK_API_KEY`: AWS access key for Bedrock API
- `AWS_REGION`: AWS region for Bedrock (default: us-east-1)
- `RESEND_API_KEY`: Resend API key for email verification

### Step 4: Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in `.env.local`.

### Step 5: Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Build for Production

```bash
pnpm build
pnpm start
```

---

## 📁 Project Structure

```
kosh/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Auth routes (login, register, verify)
│   ├── (dashboard)/              # Dashboard routes
│   ├── (groups)/                 # Group savings routes
│   └── api/                      # API routes
│       ├── ai/coach/             # AI Coach endpoint
│       ├── wallet/income/        # Tax Trap Agent endpoint
│       └── savings/group/        # Group savings endpoints
├── src/
│   ├── features/
│   │   ├── auth/                 # User authentication
│   │   │   └── models/user.model.ts
│   │   ├── tax/                  # Tax Trap Agent
│   │   │   ├── services/taxTrapAgent.service.ts
│   │   │   └── middleware/taxVaultGuardrail.ts
│   │   └── savings/
│   │       ├── individual/       # Personal savings
│   │       └── groups/           # Group savings
│   │           ├── models/
│   │           │   ├── groupCampaign.model.ts
│   │           │   └── contribution.model.ts
│   │           └── components/
│   │               └── GroupMainSectionComponent.tsx
│   └── components/
│       ├── dashboard/
│       │   ├── UserInfo.tsx      # Health Score display
│       │   ├── IncomeDepositButton.tsx
│       │   └── AICoachChat.tsx   # Floating chat bubble
│       └── ui/                   # shadcn/ui components
├── types/
│   └── index.d.ts                # Global TypeScript types
└── .kiro/
    ├── requirements.md           # Product requirements
    └── specs/                    # Feature specifications
```

---

## 🔐 Security Considerations

1. **Tax Vault Guardrail**: Server-side month validation prevents client-side bypass
2. **MongoDB Transactions**: Ensures atomic updates across multiple collections
3. **NextAuth Sessions**: Secure JWT-based authentication
4. **Zod Validation**: Input sanitization on all API routes
5. **Rate Limiting**: (Recommended) Add rate limiting middleware for production

---

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Tax Trap Agent with April lock
- ✅ AI Financial Coach with Nova Pro
- ✅ Group Savings with penalty redistribution
- ✅ Health Score gamification

### Phase 2 (Planned)
- 🔲 Community Trust Score algorithm
- 🔲 Automated loan eligibility based on savings history
- 🔲 Integration with UPI for instant payouts
- 🔲 Mobile app (React Native)

### Phase 3 (Future)
- 🔲 Micro-insurance products
- 🔲 Investment recommendations
- 🔲 Tax filing automation
- 🔲 Multi-language support (Hindi, Tamil, Telugu)

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Amazon Bedrock** for Nova Pro AI capabilities
- **shadcn/ui** for beautiful, accessible components
- **Vercel** for Next.js framework and deployment platform
- **MongoDB** for flexible, scalable database
- Indian gig workers who inspired this platform

---

**Built with ❤️ for India's gig economy**
