import { Mail, Phone, MapPin, DollarSign, Shield, FileText, Users } from 'lucide-react';
import { formatCurrency } from '@flowveda/shared';
import { KYCApplication, investorTypeLabels } from './types';
import {
  getAccreditationLabel,
  getInvestmentGoalLabel,
  getLikelihoodLabel,
  getContactPreferenceLabel,
  getTimelineLabel,
} from './kycHelpers';

interface KYCApplicationDetailsProps {
  app: KYCApplication;
}

export function KYCApplicationDetails({ app }: KYCApplicationDetailsProps) {
  return (
    <div className="ml-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Contact Info */}
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Contact Information
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {app.investorCategory === 'entity' ? app.workEmail || app.email : app.email}
          </div>
          {(app.phone || app.workPhone) && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {app.investorCategory === 'entity' ? app.workPhone : app.phone}
            </div>
          )}
          {(app.city || app.principalOfficeCity) && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>
                {app.investorCategory === 'entity'
                  ? `${app.principalOfficeCity || ''}, ${app.principalOfficeState || ''}, ${app.principalOfficeCountry || ''}`
                  : `${app.city || ''}, ${app.state || ''}, ${app.country || ''}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Investor Type */}
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Investor Details
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            {app.investorCategory === 'entity' ? 'Entity' : 'Individual'} -{' '}
            {investorTypeLabels[app.investorType] || app.investorType}
          </div>
          {app.entityLegalName && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {app.entityLegalName}
            </div>
          )}
        </div>
      </div>

      {/* Accreditation */}
      <div className="lg:col-span-2">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Accreditation Basis
        </h4>
        <div className="space-y-2 text-sm">
          {app.accreditationBases && app.accreditationBases.length > 0 ? (
            app.accreditationBases.map((basis) => (
              <div key={basis} className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-xs">{getAccreditationLabel(basis)}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No accreditation selected</p>
          )}
        </div>
      </div>

      {/* Investment Intent */}
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Investment Intent
        </h4>
        <div className="space-y-2 text-sm">
          {app.indicativeCommitment ? (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              {formatCurrency(app.indicativeCommitment)} indicative
            </div>
          ) : (
            <p className="text-muted-foreground">Not specified</p>
          )}
          {app.timeline && (
            <p>
              <span className="text-muted-foreground">Timeline:</span> {getTimelineLabel(app.timeline)}
            </p>
          )}
          {app.likelihood && (
            <p>
              <span className="text-muted-foreground">Likelihood:</span> {getLikelihoodLabel(app.likelihood)}
            </p>
          )}
        </div>
      </div>

      {/* Investment Goals */}
      {app.investmentGoals && app.investmentGoals.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Investment Goals
          </h4>
          <div className="space-y-1 text-sm">
            {app.investmentGoals.map((goal) => (
              <p key={goal}>• {getInvestmentGoalLabel(goal)}</p>
            ))}
            {app.investmentGoalsOther && (
              <p className="text-muted-foreground italic">Other: {app.investmentGoalsOther}</p>
            )}
          </div>
        </div>
      )}

      {/* Questions for Manager */}
      {app.questionsForManager && (
        <div className="lg:col-span-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Questions for Manager
          </h4>
          <p className="text-sm bg-gray-50 rounded-lg p-3 italic">"{app.questionsForManager}"</p>
        </div>
      )}

      {/* Contact Preferences */}
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Contact Preferences
        </h4>
        <div className="space-y-2 text-sm">
          {app.preferredContact && (
            <p>
              <span className="text-muted-foreground">Preferred:</span>{' '}
              {getContactPreferenceLabel(app.preferredContact)}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Consent:</span>{' '}
            {app.consentGiven ? (
              <span className="text-green-600">Given ✓</span>
            ) : (
              <span className="text-red-600">Not given</span>
            )}
          </p>
        </div>
      </div>

      {/* Entity Authorized Signer */}
      {app.investorCategory === 'entity' && app.authorizedSignerTitle && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Authorized Signer
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              {app.authorizedSignerFirstName} {app.authorizedSignerLastName}
            </p>
            <p className="text-muted-foreground">{app.authorizedSignerTitle}</p>
          </div>
        </div>
      )}
    </div>
  );
}

