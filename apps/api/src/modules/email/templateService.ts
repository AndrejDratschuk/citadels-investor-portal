/**
 * Email Template Service
 * Handles template CRUD operations and rendering
 */

import { supabaseAdmin } from '../../common/database/supabase';
import { escapeHtml, baseTemplate, header, content, primaryButton } from './templates/baseTemplate';
import {
  templateRegistry,
  getTemplateDefinition,
  getTemplatesByCategory,
  getSampleData,
  categoryLabels,
  type TemplateDefinition,
  type TemplateCategory,
  type TemplateVariable,
  type TemplateWithStatus,
} from './templateRegistry';

// ============================================================================
// Types
// ============================================================================

export interface CustomTemplate {
  id: string;
  fundId: string;
  templateKey: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateResponse {
  key: string;
  name: string;
  description: string;
  category: TemplateCategory;
  categoryLabel: string;
  variables: TemplateVariable[];
  subject: string;
  body: string;
  isCustomized: boolean;
  isActive: boolean;
}

export interface TemplateListItem {
  key: string;
  name: string;
  description: string;
  category: TemplateCategory;
  categoryLabel: string;
  isCustomized: boolean;
  isActive: boolean;
}

export interface TemplateListResponse {
  templates: TemplateListItem[];
  categories: { key: TemplateCategory; label: string; count: number }[];
}

// ============================================================================
// Template Service
// ============================================================================

class TemplateService {
  /**
   * Get all templates with customization status for a fund
   */
  async listTemplates(fundId: string): Promise<TemplateListResponse> {
    // Get all custom templates for this fund
    const { data: customTemplates, error } = await supabaseAdmin
      .from('fund_email_templates')
      .select('template_key, is_active')
      .eq('fund_id', fundId);

    if (error) {
      console.error('[TemplateService] Error fetching custom templates:', error);
      throw new Error('Failed to fetch templates');
    }

    // Create a map of customized templates
    const customMap = new Map<string, boolean>();
    for (const ct of customTemplates || []) {
      customMap.set(ct.template_key, ct.is_active);
    }

    // Build template list
    const templates: TemplateListItem[] = templateRegistry.map(def => ({
      key: def.key,
      name: def.name,
      description: def.description,
      category: def.category,
      categoryLabel: categoryLabels[def.category],
      isCustomized: customMap.has(def.key),
      isActive: customMap.get(def.key) ?? true,
    }));

    // Build category counts
    const categoryCount: Record<TemplateCategory, number> = {
      prospect: 0,
      investor_onboarding: 0,
      capital_calls: 0,
      reporting: 0,
      compliance: 0,
      exit_transfer: 0,
      team: 0,
      internal: 0,
    };

    for (const t of templates) {
      categoryCount[t.category]++;
    }

    const categories = Object.entries(categoryLabels).map(([key, label]) => ({
      key: key as TemplateCategory,
      label,
      count: categoryCount[key as TemplateCategory],
    }));

    return { templates, categories };
  }

  /**
   * Get a single template (custom or default)
   */
  async getTemplate(fundId: string, templateKey: string): Promise<TemplateResponse> {
    const definition = getTemplateDefinition(templateKey);
    if (!definition) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Check for custom template
    const { data: customTemplate, error } = await supabaseAdmin
      .from('fund_email_templates')
      .select('*')
      .eq('fund_id', fundId)
      .eq('template_key', templateKey)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[TemplateService] Error fetching custom template:', error);
      throw new Error('Failed to fetch template');
    }

    const isCustomized = !!customTemplate;
    const subject = customTemplate?.subject ?? definition.defaultSubject;
    const body = customTemplate?.body ?? definition.defaultBody;
    const isActive = customTemplate?.is_active ?? true;

    return {
      key: definition.key,
      name: definition.name,
      description: definition.description,
      category: definition.category,
      categoryLabel: categoryLabels[definition.category],
      variables: definition.variables,
      subject,
      body,
      isCustomized,
      isActive,
    };
  }

  /**
   * Save a custom template
   */
  async saveTemplate(
    fundId: string,
    templateKey: string,
    subject: string,
    body: string,
    userId?: string
  ): Promise<TemplateResponse> {
    const definition = getTemplateDefinition(templateKey);
    if (!definition) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Validate that subject and body are not empty
    if (!subject.trim()) {
      throw new Error('Subject cannot be empty');
    }
    if (!body.trim()) {
      throw new Error('Body cannot be empty');
    }

    // Upsert the custom template
    const { error } = await supabaseAdmin
      .from('fund_email_templates')
      .upsert({
        fund_id: fundId,
        template_key: templateKey,
        subject: subject.trim(),
        body: body.trim(),
        is_active: true,
        updated_by: userId || null,
      }, {
        onConflict: 'fund_id,template_key',
      });

    if (error) {
      console.error('[TemplateService] Error saving template:', error);
      throw new Error('Failed to save template');
    }

    return this.getTemplate(fundId, templateKey);
  }

  /**
   * Reset a template to default (delete custom version)
   */
  async resetTemplate(fundId: string, templateKey: string): Promise<TemplateResponse> {
    const definition = getTemplateDefinition(templateKey);
    if (!definition) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    const { error } = await supabaseAdmin
      .from('fund_email_templates')
      .delete()
      .eq('fund_id', fundId)
      .eq('template_key', templateKey);

    if (error) {
      console.error('[TemplateService] Error resetting template:', error);
      throw new Error('Failed to reset template');
    }

    return this.getTemplate(fundId, templateKey);
  }

  /**
   * Toggle template active status
   */
  async setTemplateActive(fundId: string, templateKey: string, isActive: boolean): Promise<TemplateResponse> {
    const definition = getTemplateDefinition(templateKey);
    if (!definition) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Check if custom template exists
    const { data: existing } = await supabaseAdmin
      .from('fund_email_templates')
      .select('id')
      .eq('fund_id', fundId)
      .eq('template_key', templateKey)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabaseAdmin
        .from('fund_email_templates')
        .update({ is_active: isActive })
        .eq('fund_id', fundId)
        .eq('template_key', templateKey);

      if (error) {
        console.error('[TemplateService] Error updating template status:', error);
        throw new Error('Failed to update template status');
      }
    } else {
      // Create with default content but inactive status
      const { error } = await supabaseAdmin
        .from('fund_email_templates')
        .insert({
          fund_id: fundId,
          template_key: templateKey,
          subject: definition.defaultSubject,
          body: definition.defaultBody,
          is_active: isActive,
        });

      if (error) {
        console.error('[TemplateService] Error creating template:', error);
        throw new Error('Failed to update template status');
      }
    }

    return this.getTemplate(fundId, templateKey);
  }

  /**
   * Render a template with variable replacement
   * This is the main method used by email senders
   */
  renderTemplate(
    subject: string,
    body: string,
    variables: Record<string, string | undefined>
  ): { subject: string; body: string } {
    const renderedSubject = this.replaceVariables(subject, variables);
    const renderedBody = this.replaceVariables(body, variables, true);

    return {
      subject: renderedSubject,
      body: renderedBody,
    };
  }

  /**
   * Get a rendered template for a fund
   * Combines getTemplate + renderTemplate
   */
  async getRenderedTemplate(
    fundId: string,
    templateKey: string,
    variables: Record<string, string | undefined>
  ): Promise<{ subject: string; body: string }> {
    const template = await this.getTemplate(fundId, templateKey);
    return this.renderTemplate(template.subject, template.body, variables);
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(
    fundId: string,
    templateKey: string,
    customSubject?: string,
    customBody?: string
  ): Promise<{ subject: string; body: string; html: string }> {
    const template = await this.getTemplate(fundId, templateKey);
    const sampleData = getSampleData(templateKey);

    const subject = customSubject ?? template.subject;
    const body = customBody ?? template.body;

    const rendered = this.renderTemplate(subject, body, sampleData);

    // Wrap in base template for full HTML preview
    const html = baseTemplate(
      `${header('Email Preview', 'Sample Fund Name')}${content(rendered.body)}`,
      rendered.subject
    );

    return {
      subject: rendered.subject,
      body: rendered.body,
      html,
    };
  }

  /**
   * Get template definition (static, no DB lookup)
   */
  getTemplateDefinition(templateKey: string): TemplateDefinition | undefined {
    return getTemplateDefinition(templateKey);
  }

  /**
   * Get all template definitions (static)
   */
  getAllTemplateDefinitions(): TemplateDefinition[] {
    return templateRegistry;
  }

  /**
   * Get templates by category (static)
   */
  getTemplatesByCategory(): Record<TemplateCategory, TemplateDefinition[]> {
    return getTemplatesByCategory();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Replace {{variable}} placeholders with values
   */
  private replaceVariables(
    text: string,
    variables: Record<string, string | undefined>,
    escapeValues: boolean = false
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      if (value === undefined || value === null) {
        // Keep placeholder if no value provided
        return match;
      }
      // Escape HTML in values to prevent XSS
      return escapeValues ? escapeHtml(String(value)) : String(value);
    });
  }
}

// Export singleton instance
export const templateService = new TemplateService();

// Also export the class for testing
export { TemplateService };
