/**
 * Timeline Header - Month/Year headers for the Gantt chart
 */

interface TimelineHeaderProps {
  startMonth: Date;
  totalMonths: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function TimelineHeader({ startMonth, totalMonths }: TimelineHeaderProps): JSX.Element {
  const months: Array<{ label: string; year: number; isYearStart: boolean }> = [];

  for (let i = 0; i < totalMonths; i++) {
    const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
    const monthIndex = date.getMonth();
    months.push({
      label: MONTH_NAMES[monthIndex],
      year: date.getFullYear(),
      isYearStart: monthIndex === 0 || i === 0,
    });
  }

  // Group months by year
  const years: Array<{ year: number; monthCount: number }> = [];
  let currentYear = months[0]?.year;
  let monthCount = 0;

  for (const month of months) {
    if (month.year !== currentYear) {
      years.push({ year: currentYear, monthCount });
      currentYear = month.year;
      monthCount = 1;
    } else {
      monthCount++;
    }
  }
  if (monthCount > 0) {
    years.push({ year: currentYear, monthCount });
  }

  return (
    <div className="flex flex-col border-b">
      {/* Year Row */}
      <div className="flex">
        {years.map((y, idx) => (
          <div
            key={`${y.year}-${idx}`}
            className="flex items-center justify-center border-l first:border-l-0 bg-muted/30 text-xs font-semibold py-1"
            style={{ width: `${(y.monthCount / totalMonths) * 100}%` }}
          >
            {y.year}
          </div>
        ))}
      </div>

      {/* Month Row */}
      <div className="flex">
        {months.map((m, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center border-l first:border-l-0 text-xs text-muted-foreground py-1"
            style={{ width: `${(1 / totalMonths) * 100}%` }}
          >
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}

