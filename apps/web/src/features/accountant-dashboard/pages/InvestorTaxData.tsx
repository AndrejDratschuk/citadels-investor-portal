import { RefreshCw } from 'lucide-react';
import { InvestorTaxTable } from '../components';
import { useInvestorTaxData, useExportInvestorTaxCSV } from '../hooks';

export function InvestorTaxData() {
  const { data: records, isLoading } = useInvestorTaxData();
  const { exportToCSV } = useExportInvestorTaxCSV();

  const handleExportCSV = () => {
    if (records) {
      exportToCSV(records);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Investor Tax Data</h1>
        <p className="mt-1 text-muted-foreground">
          View and export investor tax information. Click on a row to see details.
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <InvestorTaxTable
          records={records ?? []}
          onExportCSV={handleExportCSV}
        />
      )}
    </div>
  );
}

