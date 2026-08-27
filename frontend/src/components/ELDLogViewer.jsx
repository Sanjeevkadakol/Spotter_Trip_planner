import { useState } from 'react'
import ELDDayChart from './ELDDayChart'
import { Calendar, ShieldCheck } from 'lucide-react'

export default function ELDLogViewer({ logs, summary }) {
  const [activeDay, setActiveDay] = useState(0)

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-[24px] border border-[#ececec] shadow-artifact p-8 text-center max-w-4xl mx-auto">
        <p className="text-[#777b86] text-sm">No ELD logs generated.</p>
      </div>
    )
  }

  const log = logs[activeDay]

  return (
    <div className="bg-white rounded-[24px] border border-[#ececec] shadow-artifact overflow-hidden max-w-5xl mx-auto">
      {/* Day Pill Tabs Header */}
      <div className="px-6 py-3.5 border-b border-[#f2f2f3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#979799] font-medium">Standard Daily Duty Log</span>
          <h3 className="font-serif text-lg font-normal text-[#17191c]">Calendar Day Schedule</h3>
        </div>

        <div className="bg-[#f2f2f3] p-1 rounded-full inline-flex gap-1 overflow-x-auto max-w-full">
          {logs.map((l, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDay(idx)}
              className={`shrink-0 px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer
                ${ idx === activeDay
                  ? 'bg-[#17191c] text-white shadow-xs'
                  : 'text-[#777b86] hover:text-[#17191c]'
                }`}
            >
              Day {l.day}
              <span className="ml-1 text-[11px] opacity-70">({l.date.split(',')[0]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Chart area */}
      <div className="p-5">
        <ELDDayChart log={log} />
      </div>

      {/* Daily Summary Totals */}
      <div className="border-t border-[#f2f2f3] bg-[#fafafb] px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Driving (11h limit)', value: log.totals.driving },
          { label: 'On-Duty (Not Driving)', value: log.totals.on_duty_not_driving },
          { label: 'Sleeper Berth', value: log.totals.sleeper_berth },
          { label: 'Off Duty', value: log.totals.off_duty },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-[14px] p-3 border border-[#ececec]">
            <span className="text-[10px] uppercase tracking-wider text-[#777b86] font-medium block mb-0.5">{label}</span>
            <p className="text-lg font-normal text-[#17191c] tracking-tight font-sans">
              {value.toFixed(1)} <span className="text-xs text-[#979799]">hrs</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

