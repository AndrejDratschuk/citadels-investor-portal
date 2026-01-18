# Email Templates Documentation

This document contains all the exact email templates used in the Investor SaaS Project. All templates are wrapped in a base layout for consistent branding and styling.

---

## Base Layout
All templates are injected into this base HTML structure.

### Base Template (`baseTemplate.ts`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investor Portal</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; min-height: 100vh;">
  <span style="display: none; max-height: 0; overflow: hidden;">{{preheader}}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- CONTENT GOES HERE -->
        </table>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 20px; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">This is an automated message from the Investor Portal.</p>
              <p style="margin: 8px 0 0 0;">Please do not reply directly to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 1. Onboarding & Account Management

### Account Invitation (`accountInviteTemplate`)
*   **Subject**: `Create Your Investor Account - {{fundName}}`
*   **Purpose**: Sent by fund manager after meeting complete to invite investor to create account.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Create Your Investor Account</h1>
<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">Hi {{recipientName}},</p>
<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">Thank you for taking the time to meet with us. We're excited to move forward with your investment!</p>
<p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;"><strong>Next step:</strong> Create your secure investor account to complete your profile and upload verification documents.</p>
<!-- Button: Create Your Account ({{accountCreationUrl}}) -->
<p style="padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af;">This process takes about 5 minutes. You will need to set a password and verify your email address.</p>
<p>Best regards,<br><strong>{{managerName}}</strong></p>
```

### Verification Code (`verificationCodeTemplate`)
*   **Subject**: `Verify Your Email Address`
*   **Purpose**: 2FA verification code sent during account creation.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Verify Your Email Address</h1>
<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">Hi {{recipientName}},</p>
<p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">Please use the verification code below to complete your account setup:</p>
<div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827; background: #f3f4f6; padding: 16px;">{{verificationCode}}</div>
<p style="padding: 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; color: #92400e;">This code will expire in {{expiresInMinutes}} minutes.</p>
```

### Account Created (`accountCreatedTemplate`)
*   **Subject**: `Account Created Successfully - {{fundName}}`
*   **Purpose**: Confirmation sent after successful account creation.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Account Created Successfully</h1>
<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">Hi {{recipientName}},</p>
<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">Your investor account has been successfully created! You can now complete your investor profile and upload the required verification documents.</p>
<!-- Button: Complete Your Profile ({{onboardingUrl}}) -->
<p style="padding: 16px; background-color: #f0fdf4; border-left: 4px solid #22c55e; color: #166534;">After completing your profile, our team will review your documents and you will be notified of the next steps.</p>
<p>Login anytime at: {{portalUrl}}</p>
```

### Onboarding Reminder (`onboardingReminderTemplate`)
*   **Subject**: `Complete Your Investor Profile - {{fundName}}`
*   **Purpose**: Sent if onboarding is not completed within a few days.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Complete Your Investor Profile</h1>
<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">Hi {{recipientName}},</p>
<p>You are almost done! Please complete your investor profile to move forward:</p>
<!-- Button: Continue Profile ({{onboardingUrl}}) -->
<ul>
  <li>Upload verification documents</li>
  <li>Banking information</li>
  <li>Final review</li>
</ul>
<p>Best regards,<br><strong>{{fundName}}</strong></p>
```

### Welcome Investor (`welcomeInvestorTemplate`)
*   **Subject**: `Welcome to {{fundName}}!`
*   **Purpose**: Sent when investment is confirmed.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Welcome to {{fundName}}</h1>
<p style="padding: 16px; background-color: #f0fdf4; border-left: 4px solid #22c55e; color: #166534;">Congratulations! Your investment is confirmed.</p>
<div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
  <p><strong>Amount:</strong> ${{investmentAmount}}</p>
  <p><strong>Date:</strong> {{investmentDate}}</p>
  <p><strong>Fund:</strong> {{fundName}}</p>
</div>
<!-- Button: Login to Portal ({{portalUrl}}) -->
<p>In your portal you will find: Investment documents, Performance updates, Capital call notices, Quarterly reports.</p>
<p>Thank you for investing with us!<br><strong>{{fundName}} Team</strong></p>
```

---

## 2. Document Management

### Document Rejection (`documentRejectionTemplate`)
*   **Subject**: `Document Requires Attention - {{fundName}}`
*   **Purpose**: Sent when a validation document is rejected.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Document Requires Attention</h1>
<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">Hi {{recipientName}},</p>
<p>We've reviewed your submitted document and unfortunately, we need you to provide an updated version.</p>
<div style="background-color: #f9fafb; padding: 16px; border: 1px solid #e5e7eb;">
  <p><strong>{{documentName}}</strong></p>
  <p>Type: {{documentType}}</p>
</div>
<p style="padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b;"><strong>Reason for rejection:</strong><br>{{rejectionReason}}</p>
<!-- Button: Upload New Document ({{portalUrl}}) -->
```

### Document Approved (`documentApprovedTemplate`)
*   **Subject**: `Document Approved - {{fundName}}`
*   **Purpose**: Sent when a validation document is approved.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Document Approved</h1>
<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">Hi {{recipientName}},</p>
<p>Great news! Your submitted document has been reviewed and approved.</p>
<div style="background-color: #f0fdf4; padding: 16px; border: 1px solid #86efac;">
  <p style="color: #166534;">✓ Approved</p>
  <p><strong>{{documentName}}</strong></p>
  <p>Type: {{documentType}}</p>
</div>
<!-- Button: View Your Documents ({{portalUrl}}) -->
```

### Documents Ready for Signature (`documentsApprovedDocuSignTemplate`)
*   **Subject**: `Investment Documents Ready for Signature - {{fundName}}`
*   **Purpose**: Sent when all docs are approved to request DocuSign signature.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Investment Documents Ready for Signature</h1>
<p style="padding: 16px; background-color: #f0fdf4; border-left: 4px solid #22c55e; color: #166534;">Your verification documents have been approved!</p>
<p><strong>Next step:</strong> Please review and sign your investment documents:</p>
<!-- Button: Sign Documents ({{docusignUrl}}) -->
<ul>
  <li>Subscription Agreement</li>
  <li>Private Placement Memorandum Acknowledgement</li>
</ul>
```

---

## 3. Prospect & KYC Pipeline

### KYC Invitation (`kycInviteTemplate`)
*   **Subject**: `Investment Opportunity - {{fundName}}`
*   **Purpose**: Manual invite sent by manager to a prospect for KYC.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Investment Opportunity</h1>
<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">Hi {{recipientName}},</p>
<p>{{managerName}} from {{fundName}} has invited you to explore an investment opportunity.</p>
<p>To get started, please complete this brief pre-qualification form (takes 3-4 minutes):</p>
<!-- Button: Complete Pre-Qualification ({{kycUrl}}) -->
<p style="padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af;">This helps us verify you qualify as an accredited investor. We will follow up to schedule a brief call.</p>
```

### KYC Auto-Send (`kycAutoSendTemplate`)
*   **Subject**: `Thanks for Your Interest - {{fundName}}`
*   **Purpose**: Sent automatically after interest form submission.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Thanks for Your Interest</h1>
<p>Thank you for expressing interest in {{fundName}}!</p>
<p><strong>Next step:</strong> Please complete this brief pre-qualification form (takes 3-4 minutes):</p>
<!-- Button: Complete Pre-Qualification ({{kycUrl}}) -->
<p style="padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af;">This verifies you qualify as an accredited investor. We will follow up within 24 hours.</p>
```

### Meeting Invite (`meetingInviteTemplate`)
*   **Subject**: `Pre-Qualified! Schedule Your Call - {{fundName}}`
*   **Purpose**: Sent after KYC approval to schedule a call.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Pre-Qualified! Schedule Your Call</h1>
<p style="padding: 16px; background-color: #f0fdf4; border-left: 4px solid #22c55e; color: #166534;">Great news - you are pre-qualified as an accredited investor!</p>
<p><strong>Next step:</strong> Schedule a brief 15-minute call with our team to discuss the investment opportunity:</p>
<!-- Button: Schedule Call ({{calendlyUrl}}) -->
```

### Post-Meeting Onboarding (`postMeetingOnboardingTemplate`)
*   **Subject**: `Create Your Investor Account - {{fundName}}`
*   **Purpose**: Sent after meeting to invite prospect to create account.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Create Your Investor Account</h1>
<p>Thank you for our conversation! To move forward with your investment, please create your secure investor account:</p>
<!-- Button: Create Account ({{accountCreationUrl}}) -->
<ul>
  <li>Creating your secure account</li>
  <li>Completing your investor profile</li>
  <li>Uploading verification documents</li>
</ul>
```

---

## 4. Capital Calls

### Capital Call Notice (`capitalCallRequestTemplate`)
*   **Subject**: `Capital Call Notice - {{fundName}}`
*   **Purpose**: Issued to investors for a specific deal.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Capital Call Notice</h1>
<p>A capital call has been issued for your investment in <strong>{{dealName}}</strong>.</p>
<div style="background-color: #fef3c7; padding: 20px; border: 1px solid #fcd34d; color: #92400e;">
  <p style="font-size: 20px;"><strong>Amount Due: ${{amountDue}}</strong></p>
  <p><strong>Deadline:</strong> {{deadline}}</p>
  <p>Capital Call #{{capitalCallNumber}}</p>
</div>
<p><strong>Wire Instructions:</strong></p>
<div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
  <p>Bank: {{bankName}}</p>
  <p>Routing #: {{routingNumber}}</p>
  <p>Account #: {{accountNumber}}</p>
  <p>Reference: {{referenceCode}}</p>
</div>
<!-- Button: View Wire Instructions ({{wireInstructionsUrl}}) -->
```

### Wire Transfer Received (`wireConfirmationTemplate`)
*   **Subject**: `Wire Transfer Received - {{fundName}}`
*   **Purpose**: Confirms receipt of wire.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Wire Transfer Received</h1>
<p style="padding: 16px; background-color: #f0fdf4; border-left: 4px solid #22c55e; color: #166534;">Your wire transfer has been received. Thank you!</p>
<div style="background-color: #f0fdf4; padding: 20px; border: 1px solid #86efac;">
  <p style="font-size: 20px;"><strong>${{amountReceived}}</strong></p>
  <p>Date Received: {{dateReceived}}</p>
  <p>Capital Call: #{{capitalCallNumber}}</p>
  <p>Confirmation: {{confirmationNumber}}</p>
</div>
<!-- Button: View Investment Dashboard ({{dashboardUrl}}) -->
```

### Wire Issue (`wireIssueTemplate`)
*   **Subject**: `Action Required - Wire Transfer Issue - {{fundName}}`
*   **Purpose**: Sent when there's an issue with a wire transfer.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Action Required - Wire Transfer Issue</h1>
<p>We've identified an issue with your wire transfer for Capital Call #{{capitalCallNumber}}.</p>
<p style="padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b;"><strong>Issue:</strong><br>{{issueDescription}}</p>
<div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
  <p>Bank: {{bankName}}</p>
  <p>Routing #: {{routingNumber}}</p>
  <p>Account #: {{accountNumber}}</p>
  <p>Reference: {{referenceCode}}</p>
</div>
<!-- Button: View Wire Instructions ({{wireInstructionsUrl}}) -->
```

---

## 5. Team Management

### Team Invitation (`teamInviteTemplate`)
*   **Subject**: `You've been invited to join {{fundName}} on Altsui`
*   **Purpose**: Sent to new team members.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">You're Invited to Join {{fundName}}</h1>
<p><strong>{{inviterName}}</strong> has invited you to join <strong>{{fundName}}</strong> on Altsui as a <strong>{{role}}</strong>.</p>
<p>As a {{role}}, you'll have {{roleDescription}}.</p>
<!-- Button: Accept Invitation ({{acceptInviteUrl}}) -->
<p style="padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af;">This invitation will expire in {{expiryDays}} days.</p>
```

### Team Invite Reminder (`teamInviteReminderTemplate`)
*   **Subject**: `Reminder: Join {{fundName}}`
*   **Purpose**: Resent invitation reminder.

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Reminder: Join {{fundName}}</h1>
<p>This is a reminder that <strong>{{inviterName}}</strong> has invited you to join <strong>{{fundName}}</strong> on Altsui as a <strong>{{role}}</strong>.</p>
<p>Your invitation is still pending. Click below to accept and create your account.</p>
<!-- Button: Accept Invitation ({{acceptInviteUrl}}) -->
```

---

## 6. Exit & Transfer (Stage 06)

### Transfer Request Received (`transferRequestReceivedTemplate`)
*   **Subject**: `Transfer Request Received - {{fundName}}`
*   **Purpose**: Sent when an investor submits a transfer request.
*   **Trigger**: Investor submits request

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Transfer Request Received</h1>
<p>Hi {{recipientName}},</p>
<p>We have received your request to transfer your interest in {{fundName}}.</p>
<div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
  <p><strong>Transfer Type:</strong> {{transferType}}</p>
</div>
<p>We will review your request and respond within <strong>{{reviewTimeframe}}</strong>.</p>
<p style="padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af;">{{transferProcessNote}}</p>
<p>If you have any questions in the meantime, please reply to this email.</p>
<p><strong>{{fundName}} Team</strong></p>
```

### Transfer Approved (`transferApprovedTemplate`)
*   **Subject**: `Transfer Approved - {{fundName}}`
*   **Purpose**: Sent when manager approves a transfer request.
*   **Trigger**: Manager approves

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Transfer Approved</h1>
<p>Hi {{recipientName}},</p>
<p style="padding: 16px; background-color: #f0fdf4; border-left: 4px solid #22c55e; color: #166534;">Your transfer request has been approved.</p>
<div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
  <p><strong>Effective Date:</strong> {{effectiveDate}}</p>
</div>
<p>{{transferNextSteps}}</p>
<p>If this is a full transfer, you will receive a final exit statement once the transfer is complete.</p>
<p>Thank you for your investment in {{fundName}}.</p>
<p><strong>{{fundName}} Team</strong></p>
```

### Transfer Denied (`transferDeniedTemplate`)
*   **Subject**: `Transfer Request Update - {{fundName}}`
*   **Purpose**: Sent when manager denies a transfer request.
*   **Trigger**: Manager denies

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Transfer Request Update</h1>
<p>Hi {{recipientName}},</p>
<p>We have reviewed your transfer request and are unable to approve it at this time.</p>
<div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
  <p><strong>Reason:</strong> {{denialReason}}</p>
</div>
<p>{{transferDenialOptions}}</p>
<p>If you have questions or would like to discuss alternative options, please reply to this email or contact us directly.</p>
<p><strong>{{fundName}} Team</strong></p>
```

### Final Exit Statement (`finalExitStatementTemplate`)
*   **Subject**: `Final Statement - {{fundName}}`
*   **Purpose**: Sent when an investor fully exits the fund.
*   **Trigger**: Investor fully exits fund

```html
<h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Final Statement</h1>
<p>Hi {{recipientName}},</p>
<p>Your investment in {{fundName}} has been fully liquidated.</p>
<div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
  <p style="font-weight: 600;">Exit Summary</p>
  <p><strong>Total Invested:</strong> ${{totalInvested}}</p>
  <p><strong>Total Distributions:</strong> ${{totalDistributions}}</p>
  <p><strong>Final Payout:</strong> ${{finalPayout}}</p>
  <p><strong>Exit Date:</strong> {{exitDate}}</p>
</div>
<p style="padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af;">Final K-1 documents will be provided following the applicable tax year.</p>
<p>{{exitClosingMessage}}</p>
<p>Thank you for your investment in {{fundName}}. We appreciate your partnership.</p>
<p><strong>{{fundName}} Team</strong></p>
```

---

## Stage 06 Suppression Rules

| Scenario | Suppression |
|----------|-------------|
| Approval sent | Cannot send denial for same request |
| Denial sent | Cannot send approval for same request |
| Exit complete | No more transfer emails for this investor |