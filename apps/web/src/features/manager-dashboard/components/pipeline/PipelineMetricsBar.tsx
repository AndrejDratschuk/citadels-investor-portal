/**
 * PipelineMetricsBar
 * Displays key pipeline metrics in a horizontal bar
 */

import {
  Send,
  FileCheck,
  Calendar,
  ClipboardCheck,
  FileText,
  PenTool,
  UserCheck,
} from 'lucide-react';
import type { PipelineMetrics } from '@flowveda/shared';

interface PipelineMetricsBarProps {
  stats: PipelineMetrics;
}

export function PipelineMetricsBar({ stats }: PipelineMetricsBarProps): JSX.Element {
  const metrics = [
    {
      label: 'KYC Sent',
      value: stats.kycSent,
      icon: Send,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'KYC Submitted',
      value: stats.kycSubmitted,
      subValue: stats.kycSubmittedThisWeek > 0 ? `+${stats.kycSubmittedThisWeek} this week` : undefined,
      icon: FileCheck,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'Pre-Qualified',
      value: stats.preQualified,
      icon: ClipboardCheck,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      label: 'Meetings',
      value: stats.meetingsScheduled + stats.meetingsCompleted,
      subValue: `${stats.meetingsCompleted} complete`,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Onboarding',
      value: stats.onboardingInProgress,
      icon: ClipboardCheck,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Docs Pending',
      value: stats.documentsPending,
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Signing',
      value: stats.docusignPending,
      icon: PenTool,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'Ready to Convert',
      value: stats.readyToConvert,
      icon: UserCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      highlight: stats.readyToConvert > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className={`rounded-lg border p-3 ${
              metric.highlight ? 'border-green-500 bg-green-500/5' : 'bg-card'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`rounded-md p-1.5 ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground truncate">
                {metric.label}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{metric.value}</p>
              {metric.subValue && (
                <p className="text-xs text-muted-foreground">{metric.subValue}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

