import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  IndividualIdentityData,
  EntityIdentityData,
  individualIdentitySchema,
  entityIdentitySchema,
  KYCFormData,
} from '../types';

interface IdentityStepProps {
  data: KYCFormData;
  investorCategory: 'individual' | 'entity';
  onNext: (data: IndividualIdentityData | EntityIdentityData) => void;
  onBack?: () => void;
}

export function IdentityStep({ data, investorCategory, onNext, onBack }: IdentityStepProps) {
  if (investorCategory === 'entity') {
    return <EntityIdentityForm data={data} onNext={onNext} onBack={onBack} />;
  }
  return <IndividualIdentityForm data={data} onNext={onNext} onBack={onBack} />;
}

function IndividualIdentityForm({
  data,
  onNext,
  onBack,
}: {
  data: KYCFormData;
  onNext: (data: IndividualIdentityData) => void;
  onBack?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IndividualIdentityData>({
    resolver: zodResolver(individualIdentitySchema),
    defaultValues: {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      country: data.country || 'United States',
      state: data.state || '',
      city: data.city || '',
      postalCode: data.postalCode || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please provide your contact details.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder="John"
            className="mt-1.5"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder="Smith"
            className="mt-1.5"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="john@example.com"
            className="mt-1.5"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="+1 (555) 123-4567"
            className="mt-1.5"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Address</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              {...register('country')}
              placeholder="United States"
              className="mt-1.5"
            />
            {errors.country && (
              <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              {...register('state')}
              placeholder="California"
              className="mt-1.5"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              {...register('city')}
              placeholder="San Francisco"
              className="mt-1.5"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              {...register('postalCode')}
              placeholder="94102"
              className="mt-1.5"
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        {onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        ) : (
          <div />
        )}
        <Button type="submit">
          Continue
        </Button>
      </div>
    </form>
  );
}

function EntityIdentityForm({
  data,
  onNext,
  onBack,
}: {
  data: KYCFormData;
  onNext: (data: EntityIdentityData) => void;
  onBack?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntityIdentityData>({
    resolver: zodResolver(entityIdentitySchema),
    defaultValues: {
      entityLegalName: data.entityLegalName || '',
      countryOfFormation: data.countryOfFormation || 'United States',
      stateOfFormation: data.stateOfFormation || '',
      authorizedSignerFirstName: data.authorizedSignerFirstName || '',
      authorizedSignerLastName: data.authorizedSignerLastName || '',
      authorizedSignerTitle: data.authorizedSignerTitle || '',
      workEmail: data.workEmail || data.email || '',
      workPhone: data.workPhone || '',
      principalOfficeCity: data.principalOfficeCity || '',
      principalOfficeState: data.principalOfficeState || '',
      principalOfficeCountry: data.principalOfficeCountry || 'United States',
      postalCode: data.postalCode || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Entity Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please provide your organization's details.
        </p>
      </div>

      {/* Entity Details */}
      <div>
        <Label htmlFor="entityLegalName">Entity Legal Name *</Label>
        <Input
          id="entityLegalName"
          {...register('entityLegalName')}
          placeholder="ABC Investments LLC"
          className="mt-1.5"
        />
        {errors.entityLegalName && (
          <p className="mt-1 text-sm text-red-600">{errors.entityLegalName.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="countryOfFormation">Country of Formation *</Label>
          <Input
            id="countryOfFormation"
            {...register('countryOfFormation')}
            placeholder="United States"
            className="mt-1.5"
          />
          {errors.countryOfFormation && (
            <p className="mt-1 text-sm text-red-600">{errors.countryOfFormation.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="stateOfFormation">State of Formation</Label>
          <Input
            id="stateOfFormation"
            {...register('stateOfFormation')}
            placeholder="Delaware"
            className="mt-1.5"
          />
        </div>
      </div>

      {/* Authorized Signer */}
      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Authorized Signer</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="authorizedSignerFirstName">First Name *</Label>
            <Input
              id="authorizedSignerFirstName"
              {...register('authorizedSignerFirstName')}
              placeholder="John"
              className="mt-1.5"
            />
            {errors.authorizedSignerFirstName && (
              <p className="mt-1 text-sm text-red-600">{errors.authorizedSignerFirstName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="authorizedSignerLastName">Last Name *</Label>
            <Input
              id="authorizedSignerLastName"
              {...register('authorizedSignerLastName')}
              placeholder="Smith"
              className="mt-1.5"
            />
            {errors.authorizedSignerLastName && (
              <p className="mt-1 text-sm text-red-600">{errors.authorizedSignerLastName.message}</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="authorizedSignerTitle">Title/Capacity *</Label>
          <Input
            id="authorizedSignerTitle"
            {...register('authorizedSignerTitle')}
            placeholder="Managing Member"
            className="mt-1.5"
          />
          {errors.authorizedSignerTitle && (
            <p className="mt-1 text-sm text-red-600">{errors.authorizedSignerTitle.message}</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div>
            <Label htmlFor="workEmail">Work Email *</Label>
            <Input
              id="workEmail"
              type="email"
              {...register('workEmail')}
              placeholder="john@company.com"
              className="mt-1.5"
            />
            {errors.workEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.workEmail.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="workPhone">Work Phone *</Label>
            <Input
              id="workPhone"
              type="tel"
              {...register('workPhone')}
              placeholder="+1 (555) 123-4567"
              className="mt-1.5"
            />
            {errors.workPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.workPhone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Principal Office */}
      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Principal Office Address</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="principalOfficeCountry">Country *</Label>
            <Input
              id="principalOfficeCountry"
              {...register('principalOfficeCountry')}
              placeholder="United States"
              className="mt-1.5"
            />
            {errors.principalOfficeCountry && (
              <p className="mt-1 text-sm text-red-600">{errors.principalOfficeCountry.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="principalOfficeState">State/Province</Label>
            <Input
              id="principalOfficeState"
              {...register('principalOfficeState')}
              placeholder="California"
              className="mt-1.5"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div>
            <Label htmlFor="principalOfficeCity">City *</Label>
            <Input
              id="principalOfficeCity"
              {...register('principalOfficeCity')}
              placeholder="San Francisco"
              className="mt-1.5"
            />
            {errors.principalOfficeCity && (
              <p className="mt-1 text-sm text-red-600">{errors.principalOfficeCity.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              {...register('postalCode')}
              placeholder="94102"
              className="mt-1.5"
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        {onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        ) : (
          <div />
        )}
        <Button type="submit">
          Continue
        </Button>
      </div>
    </form>
  );
}

