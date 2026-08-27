import { fmtMiles, fmtHours, fmtDuration } from '../utils/formatters'
import { Route, Clock, Calendar, BedDouble, Fuel, Gauge, Sparkles, Navigation } from 'lucide-react'

export default function TripSummaryCards({ summary }) {
  const cards = [
    { label: 'Total Distance', value: fmtMiles(summary.distance_miles), icon: Route, tag: 'Mileage' },
    { label: 'Driving Time', value: fmtHours(summary.total_driving_hours), icon: Clock, tag: 'Transit' },
    { label: 'Total Duration', value: fmtDuration(summary.total_duration_hours), icon: Calendar, tag: 'Elapsed' },
    { label: 'Driving Days', value: summary.driving_days, icon: Calendar, tag: 'Calendar' },
    { label: 'Rest Stops', value: summary.rest_stops, icon: BedDouble, tag: '10h Breaks' },
    { label: 'Fuel Stops', value: summary.fuel_stops, icon: Fuel, tag: '≤1,000 mi' },
    { label: 'Cycle Remaining', value: fmtHours(summary.cycle_hours_remaining), icon: Gauge, tag: '70h Rule' },
    { label: 'Average Speed', value: `${summary.avg_speed_mph} mph`, icon: Navigation, tag: 'Property CMV' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
      {cards.map(({ label, value, icon: Icon, tag }, idx) => (
        <div 
          key={label} 
          className="bg-white rounded-[20px] border border-[#ececec] p-4 flex flex-col justify-between hover:border-[#d6d6d8] transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-wider text-[#979799] font-medium">
              {tag}
            </span>
            <div className="w-6 h-6 rounded-full bg-[#f2f2f3] flex items-center justify-center text-[#17191c]">
              <Icon className="w-3 h-3" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-normal text-[#17191c] tracking-tight">
              {value}
            </p>
            <p className="text-xs text-[#777b86] mt-0.5 font-normal">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

