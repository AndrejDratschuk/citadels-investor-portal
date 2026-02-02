import { useState, useEffect } from 'react';
import { Save, Loader2, Plus, X, ChevronDown, ChevronRight, Mail, Pencil, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { fundsApi, EmailCustomizationSettings, UpdateEmailCustomizationInput } from '@/lib/api/funds';
import {
  emailTemplatesApi,
  TemplateListResponse,
} from '@/lib/api/emailTemplates';
import { EmailTemplateEditor } from './EmailTemplateEditor';

const DEFAULTS = {
  postMeetingRecapTemplate: 'It was great learning about your investment objectives.',
  consideringSupportMessage: "I'm available whenever you have questions—just reply or schedule time.",
  documentReviewTimeframe: '1-2 business days',
  welcomeMessage: "We're excited to have you as an investor.",
  transferProcessNote: 'Per the Operating Agreement, transfer requests are subject to manager approval.',
  transferNextSteps: 'The transferee will receive onboarding instructions separately.',
  transferDenialOptions: 'You may resubmit a transfer request after 90 days.',
  exitClosingMessage: 'We wish you continued success in your investment endeavors.',
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = false }: SectionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
      {isOpen && <div className="border-t px-4 pb-4 pt-4 space-y-4">{children}</div>}
    </div>
  );
}

export function FundEmailCustomizationTab(): JSX.Element {
  const [form, setForm] = useState<EmailCustomizationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email Templates state
  const [templates, setTemplates] = useState<TemplateListResponse | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['prospect']));

  useEffect(() => {
    // Load email customization settings
    fundsApi.getEmailCustomization()
      .then(setForm)
      .catch(() => setMessage({ type: 'error', text: 'Failed to load settings' }))
      .finally(() => setLoading(false));

    // Load email templates
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const result = await emailTemplatesApi.listTemplates();
      setTemplates(result);
    } catch {
      console.error('Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleSave = async (): Promise<void> => {
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      const input: UpdateEmailCustomizationInput = { ...form };
      const updated = await fundsApi.updateEmailCustomization(input);
      setForm(updated);
      setMessage({ type: 'success', text: 'Email settings saved successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof EmailCustomizationSettings>(
    field: K,
    value: EmailCustomizationSettings[K]
  ): void => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const addNurtureSnippet = (): void => {
    if (!form || form.nurtureUpdateTemplates.length >= 5) return;
    updateField('nurtureUpdateTemplates', [...form.nurtureUpdateTemplates, '']);
  };

  const removeNurtureSnippet = (index: number): void => {
    if (!form) return;
    updateField('nurtureUpdateTemplates', form.nurtureUpdateTemplates.filter((_, i) => i !== index));
  };

  const updateNurtureSnippet = (index: number, value: string): void => {
    if (!form) return;
    const updated = [...form.nurtureUpdateTemplates];
    updated[index] = value;
    updateField('nurtureUpdateTemplates', updated);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!form) return <div className="p-4 text-red-600">Failed to load email customization settings.</div>;

  return (
    <div className="space-y-4">
      {message && (
        <div className={cn('p-4 rounded-lg', message.type === 'success' 
          ? 'bg-green-50 text-green-700 border border-green-200' 
          : 'bg-red-50 text-red-700 border border-red-200')}>{message.text}</div>
      )}

      {/* Email Templates Section */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Email Templates</h3>
              <p className="text-sm text-muted-foreground">Customize the content of automated emails</p>
            </div>
          </div>
        </div>

        {templatesLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : templates ? (
          <div className="divide-y">
            {templates.categories.map(category => {
              const categoryTemplates = templates.templates.filter(t => t.category === category.key);
              const customizedCount = categoryTemplates.filter(t => t.isCustomized).length;
              const isExpanded = expandedCategories.has(category.key);

              return (
                <div key={category.key}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.key)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{category.label}</span>
                      <span className="text-sm text-muted-foreground">({category.count})</span>
                      {customizedCount > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {customizedCount} customized
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-muted/30 divide-y divide-border/50">
                      {categoryTemplates.map(template => (
                        <div
                          key={template.key}
                          className="flex items-center justify-between px-4 py-3 pl-12"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{template.name}</span>
                              {template.isCustomized && (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {template.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTemplate(template.key)}
                            className="ml-4"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Failed to load email templates
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-stretch">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setEditingTemplate(null)} 
          />
          <div className="relative z-10 ml-auto w-full max-w-3xl bg-background shadow-xl flex flex-col">
            <EmailTemplateEditor
              templateKey={editingTemplate}
              onClose={() => setEditingTemplate(null)}
              onSave={() => loadTemplates()}
            />
          </div>
        </div>
      )}

      {/* Email Snippets Settings */}
      <div className="pt-4">
        <h3 className="text-lg font-semibold mb-4">Email Snippets & Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These snippets are used to customize specific parts of email templates.
        </p>
      </div>

      <Section title="Pre-Meeting Materials" defaultOpen>
        <div className="space-y-3">
          <Label>Material Type</Label>
          <div className="flex gap-4">
            {(['website', 'teaser_doc'] as const).map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="preMeetingType" checked={form.preMeetingMaterialsType === type}
                  onChange={() => updateField('preMeetingMaterialsType', type)} className="h-4 w-4" />
                <span>{type === 'website' ? 'Link to Website' : 'Fund Teaser Document'}</span>
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="preMeetingUrl">URL to Website or Teaser Document</Label>
            <Input id="preMeetingUrl" value={form.preMeetingMaterialsUrl || ''} placeholder="https://..."
              onChange={e => updateField('preMeetingMaterialsUrl', e.target.value || null)} />
          </div>
        </div>
      </Section>

      <Section title="Accreditation Education">
        <div className="space-y-3">
          <Label>Education Type</Label>
          <div className="flex gap-4">
            {(['standard_video', 'custom_text'] as const).map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="accreditationType" checked={form.accreditationEducationType === type}
                  onChange={() => updateField('accreditationEducationType', type)} className="h-4 w-4" />
                <span>{type === 'standard_video' ? 'Standard Explainer Video' : 'Custom Text'}</span>
              </label>
            ))}
          </div>
          {form.accreditationEducationType === 'custom_text' && (
            <div className="space-y-2">
              <Label htmlFor="accreditationContent">Custom Text for Non-Accredited Prospects</Label>
              <textarea id="accreditationContent" rows={3} value={form.accreditationEducationContent || ''}
                onChange={e => updateField('accreditationEducationContent', e.target.value || null)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          )}
        </div>
      </Section>

      <Section title="Post-Meeting Communication">
        <div className="space-y-2">
          <Label htmlFor="postMeetingRecap">Opening Message for Post-Meeting Emails</Label>
          <textarea id="postMeetingRecap" rows={2} value={form.postMeetingRecapTemplate || ''}
            placeholder={DEFAULTS.postMeetingRecapTemplate}
            onChange={e => updateField('postMeetingRecapTemplate', e.target.value || null)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </Section>

      <Section title="Nurture Content">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supportMessage">Support Message for Considering Prospects</Label>
            <textarea id="supportMessage" rows={2} value={form.consideringSupportMessage || ''}
              placeholder={DEFAULTS.consideringSupportMessage}
              onChange={e => updateField('consideringSupportMessage', e.target.value || null)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Value-Add Snippets (3-5 market insights or fund news)</Label>
              {form.nurtureUpdateTemplates.length < 5 && (
                <Button type="button" variant="outline" size="sm" onClick={addNurtureSnippet}><Plus className="h-4 w-4 mr-1" />Add</Button>
              )}
            </div>
            {form.nurtureUpdateTemplates.map((snippet, i) => (
              <div key={i} className="flex gap-2">
                <Input value={snippet} onChange={e => updateNurtureSnippet(i, e.target.value)} placeholder={`Snippet ${i + 1}`} />
                <Button type="button" variant="outline" size="icon" onClick={() => removeNurtureSnippet(i)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Investor Onboarding">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reviewTimeframe">Document Review Timeframe</Label>
            <Input id="reviewTimeframe" value={form.documentReviewTimeframe || ''} placeholder={DEFAULTS.documentReviewTimeframe}
              onChange={e => updateField('documentReviewTimeframe', e.target.value || null)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="welcomeMessage">Welcome Message After Funding</Label>
            <textarea id="welcomeMessage" rows={2} value={form.welcomeMessage || ''} placeholder={DEFAULTS.welcomeMessage}
              onChange={e => updateField('welcomeMessage', e.target.value || null)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        </div>
      </Section>

      <Section title="Transfer & Exit Messaging">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transferNote">Transfer Process Note</Label>
            <textarea id="transferNote" rows={2} value={form.transferProcessNote || ''} placeholder={DEFAULTS.transferProcessNote}
              onChange={e => updateField('transferProcessNote', e.target.value || null)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transferNextSteps">Transfer Approved Message</Label>
            <textarea id="transferNextSteps" rows={2} value={form.transferNextSteps || ''} placeholder={DEFAULTS.transferNextSteps}
              onChange={e => updateField('transferNextSteps', e.target.value || null)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transferDenial">Transfer Denied Options</Label>
            <textarea id="transferDenial" rows={2} value={form.transferDenialOptions || ''} placeholder={DEFAULTS.transferDenialOptions}
              onChange={e => updateField('transferDenialOptions', e.target.value || null)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exitClosing">Exit Closing Message</Label>
            <textarea id="exitClosing" rows={2} value={form.exitClosingMessage || ''} placeholder={DEFAULTS.exitClosingMessage}
              onChange={e => updateField('exitClosingMessage', e.target.value || null)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        </div>
      </Section>

      <Section title="Team Credentials">
        <div className="space-y-2">
          <Label htmlFor="credentials">Credentials After Your Name (e.g., "CAIA" displays as "Jay McHale, CAIA")</Label>
          <Input id="credentials" value={form.userCredentials || ''} placeholder="CAIA, CFA, etc."
            onChange={e => updateField('userCredentials', e.target.value || null)} />
        </div>
      </Section>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Email Settings
        </Button>
      </div>
    </div>
  );
}
