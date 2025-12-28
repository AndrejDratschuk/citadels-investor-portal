import { AutomationLog } from '../components/AutomationLog';

export function AutomationLogsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Automation History</h1>
        <p className="text-slate-600 mt-1">
          View all automated emails sent by the system, including document notifications,
          capital call requests, and onboarding communications.
        </p>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <AutomationLog />
      </div>
    </div>
  );
}

