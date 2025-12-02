import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealForm } from '../components/DealForm';

export function CreateDeal() {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/manager/deals">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Deals
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Add New Deal</h1>
        <p className="mt-1 text-muted-foreground">
          Create a new investment opportunity for your investors
        </p>
      </div>

      {/* Form */}
      <DealForm />
    </div>
  );
}


