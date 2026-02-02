/**
 * Email Template Editor
 * Rich text editor for customizing email templates with variable insertion
 */

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Variable,
  Eye,
  RotateCcw,
  Save,
  Loader2,
  X,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  emailTemplatesApi,
  TemplateResponse,
  TemplateVariable,
  TemplatePreviewResponse,
} from '@/lib/api/emailTemplates';

// ============================================================================
// Types
// ============================================================================

interface EmailTemplateEditorProps {
  templateKey: string;
  onClose: () => void;
  onSave?: () => void;
}

// ============================================================================
// Toolbar Button Component
// ============================================================================

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded-md transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

// ============================================================================
// Variable Picker Component
// ============================================================================

interface VariablePickerProps {
  variables: TemplateVariable[];
  onInsert: (variable: string) => void;
}

function VariablePicker({ variables, onInsert }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 rounded-md border bg-background hover:bg-muted transition-colors"
      >
        <Variable className="h-4 w-4" />
        <span className="text-sm">Insert Variable</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 w-80 max-h-64 overflow-auto rounded-lg border bg-background shadow-lg">
            <div className="p-2 border-b">
              <p className="text-xs text-muted-foreground">
                Click a variable to insert it at cursor position
              </p>
            </div>
            <div className="p-1">
              {variables.map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => {
                    onInsert(`{{${variable.key}}}`);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-primary">
                      {`{{${variable.key}}}`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{variable.description}</p>
                  {variable.example && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Example: {variable.example}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Editor Component
// ============================================================================

export function EmailTemplateEditor({ templateKey, onClose, onSave }: EmailTemplateEditorProps) {
  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [preview, setPreview] = useState<TemplatePreviewResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for email templates
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your email template...',
      }),
      Underline,
    ],
    content: '',
    onUpdate: () => {
      setHasChanges(true);
    },
  });

  // Fetch template on mount
  useEffect(() => {
    fetchTemplate();
  }, [templateKey]);

  const fetchTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailTemplatesApi.getTemplate(templateKey);
      setTemplate(result);
      setSubject(result.subject);
      editor?.commands.setContent(result.body);
      setHasChanges(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load template';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!editor || !template) return;

    setSaving(true);
    setError(null);
    try {
      const body = editor.getHTML();
      await emailTemplatesApi.saveTemplate(templateKey, { subject, body });
      setHasChanges(false);
      onSave?.();
      // Refresh template to get updated status
      await fetchTemplate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save template';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // Handle reset to default
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset this template to the default? Your customizations will be lost.')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await emailTemplatesApi.resetTemplate(templateKey);
      await fetchTemplate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset template';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // Handle preview
  const handlePreview = async () => {
    if (!editor) return;

    setPreviewing(true);
    setError(null);
    try {
      const body = editor.getHTML();
      const result = await emailTemplatesApi.previewTemplate(templateKey, subject, body);
      setPreview(result);
      setShowPreview(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate preview';
      setError(message);
    } finally {
      setPreviewing(false);
    }
  };

  // Insert variable at cursor
  const insertVariable = useCallback(
    (variable: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(variable).run();
    },
    [editor]
  );

  // Add link
  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Template not found</p>
        <Button variant="outline" onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold">{template.name}</h2>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {template.isCustomized && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Customized
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Subject line */}
        <div className="mb-4">
          <Label htmlFor="subject" className="text-sm font-medium">
            Subject Line
          </Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Email subject..."
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            You can use variables like {'{{recipientName}}'} in the subject
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 mb-2 p-2 border rounded-t-lg bg-muted/30">
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            isActive={editor?.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={editor?.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton onClick={addLink} isActive={editor?.isActive('link')} title="Add Link">
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <div className="flex-1" />

          <VariablePicker variables={template.variables} onInsert={insertVariable} />
        </div>

        {/* Editor */}
        <div className="border border-t-0 rounded-b-lg min-h-[300px] p-4 prose prose-sm max-w-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <EditorContent editor={editor} className="outline-none" />
        </div>

        {/* Variable reference */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Available Variables</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {template.variables.map((v) => (
              <code
                key={v.key}
                className="text-xs bg-background px-2 py-1 rounded border cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors"
                onClick={() => insertVariable(`{{${v.key}}}`)}
                title={`${v.description}${v.example ? ` (e.g., ${v.example})` : ''}`}
              >
                {`{{${v.key}}}`}
              </code>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t px-6 py-4">
        <div className="flex items-center gap-2">
          {template.isCustomized && (
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={previewing}>
            {previewing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Template
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPreview(false)} />
          <div className="relative z-10 bg-background rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-auto">
            <div className="sticky top-0 flex items-center justify-between border-b px-6 py-4 bg-background">
              <div>
                <h3 className="text-lg font-semibold">Email Preview</h3>
                <p className="text-sm text-muted-foreground">Preview with sample data</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <Label className="text-sm text-muted-foreground">Subject</Label>
                <p className="font-medium">{preview.subject}</p>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={preview.html}
                  title="Email Preview"
                  className="w-full h-[500px] bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
