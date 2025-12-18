import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressEntityData, addressEntitySchema, ENTITY_TYPES } from '../types';

interface AddressEntityStepProps {
  data: Partial<AddressEntityData>;
  onNext: (data: AddressEntityData) => void;
  onBack: () => void;
}

export function AddressEntityStep({ data, onNext, onBack }: AddressEntityStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddressEntityData>({
    resolver: zodResolver(addressEntitySchema),
    defaultValues: data,
  });

  const entityType = watch('entityType');
  const showEntityName = entityType && !['individual', 'joint'].includes(entityType);

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <Label htmlFor="address1">Address Line 1 *</Label>
        <Input
          id="address1"
          {...register('address1')}
          placeholder="123 Main Street"
          className="mt-1.5"
          autoComplete="address-line1"
        />
        {errors.address1 && (
          <p className="mt-1 text-sm text-red-600">{errors.address1.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="address2">Address Line 2</Label>
        <Input
          id="address2"
          {...register('address2')}
          placeholder="Suite 100 (optional)"
          className="mt-1.5"
          autoComplete="address-line2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="Austin"
            className="mt-1.5"
            autoComplete="address-level2"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            {...register('state')}
            placeholder="Texas"
            className="mt-1.5"
            autoComplete="address-level1"
          />
          {errors.state && (
            <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="zipCode">Zip Code *</Label>
          <Input
            id="zipCode"
            {...register('zipCode')}
            placeholder="78701"
            className="mt-1.5"
            autoComplete="postal-code"
          />
          {errors.zipCode && (
            <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            {...register('country')}
            placeholder="United States"
            className="mt-1.5"
            autoComplete="country-name"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Entity Information</h3>
        
        <div>
          <Label htmlFor="entityType">Entity Type *</Label>
          <select
            id="entityType"
            {...register('entityType')}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {ENTITY_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.entityType && (
            <p className="mt-1 text-sm text-red-600">{errors.entityType.message}</p>
          )}
        </div>

        {showEntityName && (
          <div className="mt-4">
            <Label htmlFor="entityName">Entity Name *</Label>
            <Input
              id="entityName"
              {...register('entityName')}
              placeholder="Smith Family Trust"
              className="mt-1.5"
            />
            {errors.entityName && (
              <p className="mt-1 text-sm text-red-600">{errors.entityName.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Enter the legal name of your trust, LLC, or corporation
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Continue
        </Button>
      </div>
    </form>
  );
}


















