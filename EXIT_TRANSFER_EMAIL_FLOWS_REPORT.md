# EXIT & TRANSFER Email Flows Report

## Executive Summary

**Status: NOT IMPLEMENTED**

The EXIT & TRANSFER email flows are **not currently implemented** in the codebase. The email template system currently covers Stages 01-04, but Stage 05 (if EXIT/TRANSFER), Stage 06, and Stage 07 email templates have not been developed.

---

## Current Email Implementation Status

### ✅ Implemented Stages

| Stage | Category | Email Count | Status |
|-------|----------|-------------|--------|
| Stage 01 | Prospect/KYC Pipeline | 17 emails | ✅ Complete |
| Stage 02 | Investor Onboarding | 12 emails | ✅ Complete |
| Stage 03 | Capital Operations | 13 emails | ✅ Complete |
| Stage 04 | Reporting & Tax | 8 emails | ✅ Complete |

**Total Implemented: 50 emails**

### ❌ Not Implemented Stages

| Stage | Category | Status |
|-------|----------|--------|
| Stage 05 | TBD (see docs) | ❌ Not Started |
| Stage 06 | TBD (see docs) | ❌ Not Started |
| Stage 07 | TBD (see docs) | ❌ Not Started |

---

## Database Support for EXIT Status

The database **does support** the `exited` status for investors:

```sql
-- From migration 025_prospect_pipeline.sql
ALTER TABLE investors 
ADD CONSTRAINT investors_status_check 
CHECK (status IN ('active', 'inactive', 'exited', 'prospect', 'onboarding'));
```

However, the shared constants (`packages/shared/src/constants/status.ts`) **do not include** the `EXITED` status:

```typescript
// Current INVESTOR_STATUS constant - missing EXITED
export const INVESTOR_STATUS = {
  PROSPECT: 'prospect',
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  // EXITED: 'exited' <-- NOT DEFINED
} as const;
```

---

## Frontend Support

The `InvestorsList` page in the Manager Dashboard **does support** filtering by `exited` status:

```typescript
// apps/web/src/features/manager-dashboard/pages/InvestorsList.tsx
type StatusFilter = 'all' | 'active' | 'inactive' | 'exited';
```

---

## Reference Documentation

The following documentation files in `assets/Email Flow Docs/` may contain EXIT & TRANSFER email specifications:

| File | Description |
|------|-------------|
| `Stage_05_Emails_Final.docx` | Stage 05 email specifications |
| `Stage_06_Emails_Final.docx` | Stage 06 email specifications |
| `Stage_07_Emails_Final.docx` | Stage 07 email specifications |
| `Email_Flow_Architecture_Master.docx` | Overall email architecture |

---

## Expected EXIT & TRANSFER Email Flows

Based on typical investor lifecycle management, EXIT & TRANSFER flows would likely include:

### Potential EXIT Emails (Investor Leaving Fund)

1. **Exit Request Acknowledgement** - Confirm receipt of exit request
2. **Exit Processing Notice** - Inform investor their exit is being processed
3. **Exit Valuation Notice** - Provide exit valuation/redemption amount
4. **Exit Approval Notice** - Confirm exit has been approved
5. **Exit Settlement Notice** - Notify when funds have been disbursed
6. **Exit Completion Confirmation** - Final confirmation of exit completion
7. **Exit Reminders** - Reminders for pending documentation
8. **Exit Rejection Notice** - If exit request is denied/delayed

### Potential TRANSFER Emails (Interest Transfer)

1. **Transfer Request Received** - Acknowledge transfer request
2. **Transfer Documentation Required** - Request necessary documents
3. **Transfer Pending Approval** - Inform transferor/transferee of pending status
4. **Transfer Approved** - Confirm transfer has been approved
5. **Transfer to New Investor Welcome** - Welcome new investor (transferee)
6. **Transfer Completion - Transferor** - Confirm exit for selling investor
7. **Transfer Completion - Transferee** - Confirm acquisition for buying investor
8. **ROFR (Right of First Refusal) Notice** - Notify existing investors of transfer opportunity

### Secondary Sale Emails

1. **Secondary Sale Listing Notice** - Inform existing investors of available interest
2. **Secondary Sale Interest Expression** - Confirm interest in purchasing
3. **Secondary Sale Matched** - Notify buyer/seller of match
4. **Secondary Sale Settlement** - Transaction completion notice

---

## Codebase Locations for Implementation

When implementing EXIT & TRANSFER emails, the following files will need updates:

### New Template File
```
apps/api/src/modules/email/templates/exitTransferTemplates.ts
```

### Files to Update

| File | Changes Needed |
|------|----------------|
| `apps/api/src/modules/email/templates/index.ts` | Export new templates |
| `apps/api/src/modules/email/email.service.ts` | Add send methods |
| `packages/shared/src/constants/status.ts` | Add EXITED to INVESTOR_STATUS |
| `EMAIL_TEMPLATES.md` | Document new templates |

### Database Migrations Needed

- Add `exit_requested_at`, `exit_reason`, `exit_processed_at` columns to investors table
- Create `investor_transfers` table for tracking transfers
- Add `transfer_status` fields

---

## Recommendations

1. **Review Stage Documentation** - Extract specifications from Stage_05_Emails_Final.docx, Stage_06_Emails_Final.docx, and Stage_07_Emails_Final.docx

2. **Add EXITED Constant** - Update `packages/shared/src/constants/status.ts`:
   ```typescript
   export const INVESTOR_STATUS = {
     PROSPECT: 'prospect',
     ONBOARDING: 'onboarding',
     ACTIVE: 'active',
     INACTIVE: 'inactive',
     EXITED: 'exited', // Add this
   } as const;
   ```

3. **Create Database Schema** - Design tables for exit requests and transfers

4. **Implement Templates** - Create `exitTransferTemplates.ts` following the existing pattern

5. **Add Email Service Methods** - Extend `email.service.ts` with exit/transfer methods

---

## Summary

| Aspect | Current State |
|--------|---------------|
| EXIT Email Templates | ❌ Not Implemented |
| TRANSFER Email Templates | ❌ Not Implemented |
| Database Schema for EXIT | ⚠️ Partial (status only) |
| Database Schema for TRANSFER | ❌ Not Implemented |
| Frontend Support | ⚠️ Partial (filter only) |
| Documentation | ✅ Available (DOCX files) |

---

*Report Generated: January 18, 2026*
