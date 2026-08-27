import { stopTypeColor } from '../utils/formatters'

export default function StopsTable({ stops }) {
  if (!stops || stops.length === 0) {
    return (
      <div className="bg-white rounded-[24px] border border-[#ececec] shadow-artifact p-8 text-center">
        <p className="text-[#777b86] text-sm">No intermediate stops required for this route.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[24px] border border-[#ececec] shadow-artifact overflow-hidden">
      <div className="overflow-x-auto max-h-[520px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#fafafb] border-b border-[#ececec] z-10">
            <tr>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#777b86] uppercase tracking-wider">#</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#777b86] uppercase tracking-wider">Stop Type</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#777b86] uppercase tracking-wider">Arrival</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#777b86] uppercase tracking-wider">Departure</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#777b86] uppercase tracking-wider">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f3]">
            {stops.map((stop) => (
              <tr key={stop.id} className="hover:bg-[#fafafb] transition-colors">
                <td className="px-5 py-3.5 text-xs text-[#979799] font-mono">{stop.id}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stopTypeColor(stop.type)}`}>
                    {stop.label}
                  </span>
                  {stop.reason && (
                    <span className="block text-[11px] text-[#777b86] mt-0.5 max-w-xs truncate">
                      {stop.reason}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-[#17191c] font-mono text-xs">{stop.arrival_time}</td>
                <td className="px-5 py-3.5 text-[#17191c] font-mono text-xs">{stop.departure_time}</td>
                <td className="px-5 py-3.5 text-[#777b86] text-xs font-medium">{stop.duration_minutes} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

