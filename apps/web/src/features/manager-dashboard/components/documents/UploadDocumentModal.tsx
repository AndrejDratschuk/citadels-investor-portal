import { useState } from 'react';
import { FileText, Upload, X, Briefcase, Building2, Users, Check, Tag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  documentsApi,
  DocumentCategory,
  DocumentDepartment,
  DocumentStatus,
  typeLabels,
  categoryLabels,
  departmentLabels,
  documentStatusLabels,
} from '@/lib/api/documents';
import { DealOption, InvestorOption, Document } from './types';

interface UploadDocumentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  deals: DealOption[];
  investors: InvestorOption[];
}

export function UploadDocumentModal({
  onClose,
  onSuccess,
  deals,
  investors,
}: UploadDocumentModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Document['type']>('other');
  const [category, setCategory] = useState<DocumentCategory>('fund');
  const [department, setDepartment] = useState<DocumentDepartment | ''>('');
  const [status, setStatus] = useState<DocumentStatus>('final');
  const [selectedDeal, setSelectedDeal] = useState<string>('');
  const [selectedInvestor, setSelectedInvestor] = useState<string>('');
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddTag = (): void => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string): void => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleUpload = async (): Promise<void> => {
    if (!name || !file) return;

    setIsUploading(true);
    try {
      const { fileUrl } = await documentsApi.uploadFile(file);

      await documentsApi.create({
        name,
        type,
        category,
        department: department || undefined,
        status,
        tags: tags.length > 0 ? tags : undefined,
        dealId: category === 'deal' ? selectedDeal || undefined : undefined,
        investorId: category === 'investor' ? selectedInvestor || undefined : undefined,
        filePath: fileUrl,
        requiresSignature,
      });

      onSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {/* Document Name */}
          <div className="space-y-2">
            <Label>Document Name *</Label>
            <Input
              placeholder="Enter document name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(categoryLabels) as [DocumentCategory, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium transition-colors',
                      category === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted hover:bg-muted/50'
                    )}
                  >
                    {value === 'fund' && <Briefcase className="h-4 w-4" />}
                    {value === 'deal' && <Building2 className="h-4 w-4" />}
                    {value === 'investor' && <Users className="h-4 w-4" />}
                    {label}
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {category === 'fund' &&
                'Fund-level documents like PPMs, quarterly reports, and announcements.'}
              {category === 'deal' && 'Documents specific to a deal or property.'}
              {category === 'investor' && 'Documents specific to an individual investor.'}
            </p>
          </div>

          {/* Deal Selection */}
          {category === 'deal' && (
            <div className="space-y-2">
              <Label>Associated Deal</Label>
              <select
                value={selectedDeal}
                onChange={(e) => setSelectedDeal(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a deal...</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Investor Selection */}
          {category === 'investor' && (
            <div className="space-y-2">
              <Label>Associated Investor</Label>
              <select
                value={selectedInvestor}
                onChange={(e) => setSelectedInvestor(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select an investor...</option>
                {investors.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.firstName} {inv.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Document Type *</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Document['type'])}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label>Department</Label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as DocumentDepartment | '')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {Object.entries(departmentLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(documentStatusLabels) as [DocumentStatus, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-md border p-2.5 text-sm font-medium transition-colors',
                      status === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted hover:bg-muted/50'
                    )}
                  >
                    {status === value && <Check className="h-3.5 w-3.5" />}
                    {label}
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {status === 'draft' && 'Draft documents are only visible to fund managers.'}
              {status === 'review' && 'Under Review documents are only visible to fund managers.'}
              {status === 'final' && 'Final documents are visible to investors.'}
            </p>
          </div>

          {/* Custom Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>File *</Label>
            <div
              className={cn(
                'rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors',
                file && 'border-primary bg-primary/5'
              )}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input
                id="fileInput"
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag & drop or click to upload
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Requires Signature */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresSignature"
              checked={requiresSignature}
              onChange={(e) => setRequiresSignature(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="requiresSignature">Requires signature</Label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!name || !file || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
}

