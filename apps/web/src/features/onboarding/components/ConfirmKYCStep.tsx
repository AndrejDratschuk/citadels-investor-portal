import { CheckCircle2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KYCApplication } from '@/features/kyc/types';

interface ConfirmKYCStepProps {
  kycData: KYCApplication;
  onConfirm: () => void;
  onEdit: () => void;
}

export function ConfirmKYCStep({ kycData, onConfirm, onEdit }: ConfirmKYCStepProps) {
  const isEntity = kycData.investorCategory === 'entity';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Confirm Your Information</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Please verify the information you provided during pre-qualification is correct.
        </p>
      </div>

      {/* Information Summary */}
      <div className="rounded-lg border bg-gray-50 p-6 space-y-4">
        {isEntity ? (
          <>
            {/* Entity Information */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Entity Information
              </h4>
              <div className="space-y-2">
                <InfoRow label="Entity Name" value={kycData.entityLegalName} />
                <InfoRow label="Country of Formation" value={kycData.countryOfFormation} />
                {kycData.stateOfFormation && (
                  <InfoRow label="State of Formation" value={kycData.stateOfFormation} />
                )}
              </div>
            </div>

            {/* Authorized Signer */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Authorized Signer
              </h4>
              <div className="space-y-2">
                <InfoRow 
                  label="Name" 
                  value={`${kycData.authorizedSignerFirstName} ${kycData.authorizedSignerLastName}`} 
                />
                <InfoRow label="Title" value={kycData.authorizedSignerTitle} />
                <InfoRow label="Email" value={kycData.workEmail} />
                <InfoRow label="Phone" value={kycData.workPhone} />
              </div>
            </div>

            {/* Principal Office */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Principal Office
              </h4>
              <div className="space-y-2">
                <InfoRow label="City" value={kycData.principalOfficeCity} />
                {kycData.principalOfficeState && (
                  <InfoRow label="State" value={kycData.principalOfficeState} />
                )}
                <InfoRow label="Country" value={kycData.principalOfficeCountry} />
                <InfoRow label="Postal Code" value={kycData.postalCode} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Individual Information */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Personal Information
              </h4>
              <div className="space-y-2">
                <InfoRow label="Name" value={`${kycData.firstName} ${kycData.lastName}`} />
                <InfoRow label="Email" value={kycData.email} />
                <InfoRow label="Phone" value={kycData.phone} />
              </div>
            </div>

            {/* Address */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Address
              </h4>
              <div className="space-y-2">
                <InfoRow label="City" value={kycData.city} />
                {kycData.state && <InfoRow label="State" value={kycData.state} />}
                <InfoRow label="Country" value={kycData.country} />
                <InfoRow label="Postal Code" value={kycData.postalCode} />
              </div>
            </div>
          </>
        )}

        {/* Investment Intent */}
        {(kycData.indicativeCommitment || kycData.timeline || kycData.likelihood) && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
              Investment Intent
            </h4>
            <div className="space-y-2">
              {kycData.indicativeCommitment && (
                <InfoRow 
                  label="Indicative Commitment" 
                  value={`$${kycData.indicativeCommitment.toLocaleString()}`} 
                />
              )}
              {kycData.timeline && (
                <InfoRow 
                  label="Timeline" 
                  value={formatTimeline(kycData.timeline)} 
                />
              )}
              {kycData.likelihood && (
                <InfoRow 
                  label="Likelihood" 
                  value={kycData.likelihood.charAt(0).toUpperCase() + kycData.likelihood.slice(1)} 
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onEdit}>
          <Edit2 className="mr-2 h-4 w-4" />
          Edit Information
        </Button>
        <Button onClick={onConfirm}>
          Confirm & Continue
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function formatTimeline(timeline: string): string {
  const map: Record<string, string> = {
    asap: 'ASAP',
    '30_60_days': '30-60 days',
    '60_90_days': '60-90 days',
    over_90_days: '>90 days',
  };
  return map[timeline] || timeline;
}

