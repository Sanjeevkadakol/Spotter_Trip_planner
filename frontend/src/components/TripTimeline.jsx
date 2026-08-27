import { stopTypeColor } from '../utils/formatters'
import { Truck, Coffee, BedDouble, Fuel, Package, MapPin, Flag, RotateCcw } from 'lucide-react'

const TYPE_ICONS = {
  start: Flag,
  driving: Truck,
  break: Coffee,
  rest: BedDouble,
  restart: RotateCcw,
  fuel: Fuel,
  pickup: Package,
  dropoff: MapPin,
  end: Flag,
}

const TYPE_BADGES = {
  start: 'bg-[#17191c] text-white',
  driving: 'bg-[#f2f2f3] text-[#17191c]',
  break: 'bg-[#fafafb] text-[#777b86] border border-[#ececec]',
  rest: 'bg-[#fbe1d1] text-[#5d2a1a]',
  restart: 'bg-[#5d2a1a] text-[#fbe1d1]',
  fuel: 'bg-[#ffeedd] text-[#b45309]',
  pickup: 'bg-[#17191c] text-white',
  dropoff: 'bg-[#17191c] text-white',
  end: 'bg-[#17191c] text-white',
}

export default function TripTimeline({ timeline }) {
  const displayEvents = timeline.filter(e => e.type !== 'driving' || e.duration_hours >= 0.25)

  return (
    <div className="bg-white rounded-[24px] border border-[#ececec] shadow-artifact overflow-hidden">
      <div className="max-h-[520px] overflow-y-auto p-6">
        <div className="space-y-0">
          {displayEvents.map((event, idx) => {
            const Icon = TYPE_ICONS[event.type] || Truck
            const isLast = idx === displayEvents.length - 1

            return (
              <div key={idx} className="flex gap-4">
                {/* Timeline vertical connector */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#f2f2f3] border border-[#ececec] flex items-center justify-center shrink-0 z-10 text-[#17191c]">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {!isLast && <div className="w-px bg-[#ececec] flex-1 my-1" style={{ minHeight: 24 }} />}
                </div>

                {/* Event info */}
                <div className={`pb-5 flex-1 ${isLast ? 'pb-0' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#17191c]">{event.label}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_BADGES[event.type] || 'bg-[#f2f2f3] text-[#17191c]'}`}>
                        {event.type}
                      </span>
                    </div>
                    <span className="text-xs text-[#777b86] font-mono">{event.start_time}</span>
                  </div>

                  {event.duration_hours > 0 && (
                    <p className="text-xs text-[#777b86] mt-0.5">
                      Duration: {Math.round(event.duration_hours * 60)} min
                    </p>
                  )}

                  {event.notes && (
                    <p className="text-xs text-[#777b86] mt-1 leading-relaxed bg-[#fafafb] rounded-[12px] p-2.5 border border-[#ececec]">
                      {event.notes}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

