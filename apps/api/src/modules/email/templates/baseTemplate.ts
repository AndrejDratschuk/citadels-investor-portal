/**
 * Base Email Template Components
 * Shared layout and styling components for all email templates
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * CRITICAL: Always use this for any user-provided content in email templates
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Base template wrapper for consistent styling
 */
export const baseTemplate = (content: string, preheader: string = ''): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investor Portal</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; min-height: 100vh;">
  ${preheader ? `<span style="display: none; max-height: 0; overflow: hidden;">${preheader}</span>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          ${content}
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
`;

/**
 * Primary button component
 */
export const primaryButton = (text: string, url: string): string => `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
  <tr>
    <td align="center" bgcolor="#1e40af" style="border-radius: 6px;">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`;

/**
 * Secondary button component (outlined style)
 */
export const secondaryButton = (text: string, url: string): string => `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 16px 0;">
  <tr>
    <td align="center" style="border: 2px solid #1e40af; border-radius: 6px;">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #1e40af; text-decoration: none; border-radius: 6px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`;

/**
 * Two buttons side by side
 */
export const buttonRow = (buttons: Array<{ text: string; url: string; primary?: boolean }>): string => `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
  <tr>
    ${buttons.map((btn, i) => `
    <td align="center" ${btn.primary ? 'bgcolor="#1e40af"' : 'style="border: 2px solid #1e40af;"'} style="border-radius: 6px;${i > 0 ? ' margin-left: 12px;' : ''}">
      <a href="${btn.url}" target="_blank" style="display: inline-block; padding: ${btn.primary ? '14px 32px' : '12px 28px'}; font-size: ${btn.primary ? '16px' : '14px'}; font-weight: 600; color: ${btn.primary ? '#ffffff' : '#1e40af'}; text-decoration: none; border-radius: 6px;">
        ${btn.text}
      </a>
    </td>
    ${i < buttons.length - 1 ? '<td style="width: 12px;"></td>' : ''}
    `).join('')}
  </tr>
</table>
`;

/**
 * Header component
 */
export const header = (title: string, fundName?: string): string => `
<tr>
  <td style="padding: 32px 40px 16px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
    ${fundName ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">${fundName}</p>` : ''}
    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">${title}</h1>
  </td>
</tr>
`;

/**
 * Content section wrapper
 */
export const content = (html: string): string => `
<tr>
  <td style="padding: 32px 40px;">
    ${html}
  </td>
</tr>
`;

type InfoBoxType = 'info' | 'warning' | 'success' | 'error';

/**
 * Alert/info box component
 */
export const infoBox = (text: string, type: InfoBoxType = 'info'): string => {
  const colors = {
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
    success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
    error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  };
  const c = colors[type];
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0;">
  <tr>
    <td style="padding: 16px; background-color: ${c.bg}; border-left: 4px solid ${c.border}; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: ${c.text};">${text}</p>
    </td>
  </tr>
</table>
`;
};

/**
 * Detail box for displaying structured information
 */
export const detailBox = (items: Array<{ label: string; value: string }>): string => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
  <tr>
    <td style="padding: 20px;">
      ${items.map(item => `<p style="margin: 0 0 4px 0; font-size: 16px; color: #111827;"><strong>${item.label}:</strong> ${item.value}</p>`).join('')}
    </td>
  </tr>
</table>
`;

