import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowLeft, Printer, ArrowRight, Truck } from 'lucide-react'
import TripSummaryCards from '../components/TripSummaryCards'
import RouteMap from '../components/RouteMap'
import TripTimeline from '../components/TripTimeline'
import StopsTable from '../components/StopsTable'
import ELDLogViewer from '../components/ELDLogViewer'

export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { result, form } = location.state || {}

  useEffect(() => {
    if (!result) navigate('/')
  }, [result, navigate])

  if (!result) return null

  const { trip_summary, locations, route, stops, timeline, eld_logs } = result

  return (
    <div className="min-h-screen bg-[#fafafb] text-[#17191c]">
      {/* Top bar — quiet editorial header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#ececec] sticky top-0 z-40 no-print">
        <div className="w-full px-6 lg:px-10 py-3.5">
          <div className="flex items-center justify-between">
            
            {/* Left: Ghost Pill button + Route */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-xs font-medium text-[#17191c] border border-[#17191c] hover:bg-[#17191c] hover:text-white px-4 py-2 rounded-full transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Planner</span>
              </button>

              <div className="hidden md:flex items-center gap-2 text-sm text-[#17191c]">
                <span className="font-medium">{locations.current.name}</span>
                <span className="text-[#979799]">→</span>
                <span className="font-medium">{locations.pickup.name}</span>
                <span className="text-[#979799]">→</span>
                <span className="font-medium">{locations.dropoff.name}</span>
              </div>
            </div>

            {/* Right: Print ELD Logs Filled Pill */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#fbe1d1] text-[#5d2a1a] rounded-full text-xs font-medium">
                <span>{trip_summary.driving_days} Driving Day{trip_summary.driving_days !== 1 ? 's' : ''}</span>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-xs font-medium bg-[#17191c] hover:bg-black text-white px-4 py-2 rounded-full transition-all cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print ELD Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Full-Width Content */}
      <div className="w-full px-6 lg:px-10 py-8 space-y-10">
        
        {/* Page Title & Route Banner */}
        <div className="space-y-1">
          <p className="text-xs text-[#979799] uppercase tracking-wider font-medium">HOS Dispatch Analysis</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#17191c] font-normal tracking-tight">
            Trip Itinerary & Compliance Plan
          </h1>
        </div>

        {/* Summary Stat Cards */}
        <TripSummaryCards summary={trip_summary} />

        {/* Route Map */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#979799] uppercase tracking-wider font-medium">Geographic Highway Route</p>
              <h2 className="font-serif text-2xl font-normal text-[#17191c]">Live Route & Stop Mapping</h2>
            </div>
            <span className="text-xs text-[#777b86] font-normal">
              {trip_summary.distance_miles.toLocaleString()} Total Miles
            </span>
          </div>

          <div className="rounded-[24px] overflow-hidden border border-[#ececec] bg-white shadow-artifact" style={{ height: 560 }}>
            <RouteMap
              route={route}
              locations={locations}
              stops={stops}
            />
          </div>
        </section>

        {/* Timeline + Stops 2-column spread */}
        <div className="grid lg:grid-cols-2 gap-8">
          <section className="space-y-3">
            <div>
              <p className="text-xs text-[#979799] uppercase tracking-wider font-medium">Chronological Schedule</p>
              <h2 className="font-serif text-2xl font-normal text-[#17191c]">Trip Timeline</h2>
            </div>
            <TripTimeline timeline={timeline} />
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-xs text-[#979799] uppercase tracking-wider font-medium">En-Route Mandatory Stops</p>
              <h2 className="font-serif text-2xl font-normal text-[#17191c]">Stops & Breaks ({stops.length})</h2>
            </div>
            <StopsTable stops={stops} />
          </section>
        </div>

        {/* ELD Daily Logs */}
        <section className="space-y-3">
          <div>
            <p className="text-xs text-[#979799] uppercase tracking-wider font-medium">Standard 24-Hour Duty Logs</p>
            <h2 className="font-serif text-2xl font-normal text-[#17191c]">
              Driver Daily Logs ({eld_logs.length} Day{eld_logs.length !== 1 ? 's' : ''})
            </h2>
          </div>
          <ELDLogViewer logs={eld_logs} summary={trip_summary} />
        </section>

      </div>
    </div>
  )
}

