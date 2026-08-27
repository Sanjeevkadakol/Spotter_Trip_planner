import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, MapPin, Package, Clock, ArrowRight, ShieldCheck, Navigation, FileText, AlertCircle, Sparkles } from 'lucide-react'
import { useTripPlanner } from '../hooks/useTripPlanner'
import LoadingOverlay from '../components/LoadingOverlay'

export default function LandingPage() {
  const navigate = useNavigate()
  const { state, result, error, loadingStep, loadingText, plan, reset, STEPS } = useTripPlanner()

  const [form, setForm] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    cycle_used_hours: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})

  // Safely navigate on success using useEffect
  useEffect(() => {
    if (state === 'success' && result) {
      navigate('/results', { state: { result, form } })
    }
  }, [state, result, navigate, form])


  function validate() {
    const errs = {}
    if (!form.current_location.trim()) errs.current_location = 'Current location is required'
    if (!form.pickup_location.trim()) errs.pickup_location = 'Pickup location is required'
    if (!form.dropoff_location.trim()) errs.dropoff_location = 'Dropoff location is required'
    const ch = parseFloat(form.cycle_used_hours)
    if (form.cycle_used_hours === '' || isNaN(ch)) errs.cycle_used_hours = 'Cycle hours is required'
    else if (ch < 0 || ch > 70) errs.cycle_used_hours = 'Cycle hours must be between 0 and 70'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    plan({
      current_location: form.current_location.trim(),
      pickup_location: form.pickup_location.trim(),
      dropoff_location: form.dropoff_location.trim(),
      cycle_used_hours: parseFloat(form.cycle_used_hours),
    })
  }

  function handleQuickFill(curr, pick, drop, cycle) {
    setForm({
      current_location: curr,
      pickup_location: pick,
      dropoff_location: drop,
      cycle_used_hours: cycle.toString(),
    })
    setFieldErrors({})
  }

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (fieldErrors[field]) setFieldErrors(fe => ({ ...fe, [field]: undefined }))
  }

  const inputCls = (field) =>
    `w-full pl-11 pr-4 py-3 rounded-[16px] border text-sm transition-all duration-200 outline-none
     focus:bg-white bg-[#f8f8f9] text-[#17191c] placeholder:text-[#a3a6af]
     ${ fieldErrors[field] ? 'border-red-400 ring-1 ring-red-300' : 'border-[#ececec] hover:border-[#d6d6d8] focus:border-[#17191c]' }`

  return (
    <div className="min-h-screen bg-[#fafafb] text-[#17191c]">
      {/* Navbar — whisper quiet */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#ececec] sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-18 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#17191c] rounded-full flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-[#17191c]">SpotterELD</span>
              <span className="text-xs bg-[#fbe1d1] text-[#5d2a1a] px-2.5 py-0.5 rounded-full font-medium">
                HOS Engine
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#777b86]">
              <span className="hidden md:inline font-normal">70h / 8-Day FMCSA Rules</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-12 pb-16">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Editorial Display */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#fbe1d1] text-[#5d2a1a] rounded-full px-3.5 py-1 text-xs font-medium tracking-tight">
              <Sparkles className="w-3.5 h-3.5" />
              Automated Hours of Service Intelligence
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[#17191c] leading-[1.18] tracking-tight">
              Precise trip dispatch for <span className="italic">professional drivers</span>.
            </h1>

            <p className="text-base sm:text-lg text-[#777b86] max-w-xl font-normal leading-relaxed">
              Calculate legal HOS routes, schedule mandatory 30-minute breaks and 10-hour rest cycles, map fuel intervals, and instantly draw ready-to-inspect ELD log sheets.
            </p>

            {/* Quick-fill suggestions */}
            <div className="pt-2">
              <p className="text-xs text-[#979799] uppercase tracking-wider font-medium mb-2.5">
                Example Route presets
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('Chicago, IL', 'Dallas, TX', 'Los Angeles, CA', 20)}
                  className="text-xs text-[#17191c] bg-[#f2f2f3] hover:bg-[#e7e7e9] px-3.5 py-1.5 rounded-full border border-transparent transition-colors"
                >
                  Chicago → Dallas → LA (20h cycle)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('Chicago, IL', 'Springfield, IL', 'St. Louis, MO', 0)}
                  className="text-xs text-[#17191c] bg-[#f2f2f3] hover:bg-[#e7e7e9] px-3.5 py-1.5 rounded-full border border-transparent transition-colors"
                >
                  Short Haul: Chicago → St. Louis
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('Chicago, IL', 'Memphis, TN', 'Dallas, TX', 65)}
                  className="text-xs text-[#17191c] bg-[#f2f2f3] hover:bg-[#e7e7e9] px-3.5 py-1.5 rounded-full border border-transparent transition-colors"
                >
                  Near-Limit 65h Restart Test
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-4 text-xs text-[#777b86]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#17191c]"></span>
                11h Drive / 14h Window
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#17191c]"></span>
                30-min break after 8h drive
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#17191c]"></span>
                Fuel every ≤ 1,000 miles
              </div>
            </div>
          </div>

          {/* Right: Planning Artifact Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[24px] shadow-artifact border border-[#ececec] p-7 sm:p-8 relative">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f2f2f3]">
                <div>
                  <h2 className="font-serif text-xl font-normal text-[#17191c]">Plan Route & Schedule</h2>
                  <p className="text-xs text-[#777b86] mt-0.5">Generates map, stops & daily ELD sheets</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#f2f2f3] flex items-center justify-center text-[#17191c]">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
              </div>

              {state === 'error' && (
                <div className="mb-5 flex items-start gap-3 bg-[#fff1f0] border border-[#ffccc7] rounded-[16px] p-4">
                  <AlertCircle className="w-4 h-4 text-[#cf1322] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#cf1322]">Planning unable to proceed</p>
                    <p className="text-xs text-[#cf1322] mt-0.5 leading-relaxed">{error}</p>
                    <button onClick={reset} className="mt-1.5 text-xs text-[#cf1322] underline font-medium">
                      Reset and try again
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Location */}
                <div>
                  <label className="block text-[11px] font-medium text-[#777b86] uppercase tracking-wider mb-1.5">
                    Current Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a6af]" />
                    <input
                      type="text"
                      value={form.current_location}
                      onChange={e => handleChange('current_location', e.target.value)}
                      placeholder="e.g. Chicago, IL"
                      className={inputCls('current_location')}
                      disabled={state === 'loading'}
                    />
                  </div>
                  {fieldErrors.current_location && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.current_location}</p>
                  )}
                </div>

                {/* Pickup Location */}
                <div>
                  <label className="block text-[11px] font-medium text-[#777b86] uppercase tracking-wider mb-1.5">
                    Pickup Location (1h dwell)
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a6af]" />
                    <input
                      type="text"
                      value={form.pickup_location}
                      onChange={e => handleChange('pickup_location', e.target.value)}
                      placeholder="e.g. Dallas, TX"
                      className={inputCls('pickup_location')}
                      disabled={state === 'loading'}
                    />
                  </div>
                  {fieldErrors.pickup_location && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.pickup_location}</p>
                  )}
                </div>

                {/* Dropoff Location */}
                <div>
                  <label className="block text-[11px] font-medium text-[#777b86] uppercase tracking-wider mb-1.5">
                    Dropoff Location (1h dwell)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a6af]" />
                    <input
                      type="text"
                      value={form.dropoff_location}
                      onChange={e => handleChange('dropoff_location', e.target.value)}
                      placeholder="e.g. Los Angeles, CA"
                      className={inputCls('dropoff_location')}
                      disabled={state === 'loading'}
                    />
                  </div>
                  {fieldErrors.dropoff_location && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.dropoff_location}</p>
                  )}
                </div>

                {/* Cycle Hours */}
                <div>
                  <label className="block text-[11px] font-medium text-[#777b86] uppercase tracking-wider mb-1.5">
                    Current Cycle Used (Hours, 0–70)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a6af]" />
                    <input
                      type="number"
                      min="0"
                      max="70"
                      step="0.5"
                      value={form.cycle_used_hours}
                      onChange={e => handleChange('cycle_used_hours', e.target.value)}
                      placeholder="e.g. 20"
                      className={inputCls('cycle_used_hours')}
                      disabled={state === 'loading'}
                    />
                  </div>
                  {fieldErrors.cycle_used_hours && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.cycle_used_hours}</p>
                  )}
                </div>

                {/* Submit Pill Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={state === 'loading'}
                    className="w-full bg-[#17191c] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed
                               text-white font-normal py-3.5 px-6 rounded-full transition-all duration-200
                               flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
                  >
                    {state === 'loading' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Computing HOS Schedule...</span>
                      </>
                    ) : (
                      <>
                        <span>Plan Trip</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Feature spread — Steep Neutral & Accent Cards */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 border-t border-[#ececec]">
        <div className="mb-8">
          <p className="text-xs text-[#979799] uppercase tracking-wider font-medium">Core Capabilities</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#17191c] mt-1 font-normal">
            Designed for regulatory precision and clean dispatch.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#f2f2f3] rounded-[24px] p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs text-[#979799] uppercase tracking-wider font-medium mb-3">FMCSA § 395</p>
              <h3 className="font-serif text-xl text-[#17191c] mb-2 font-normal">Deterministic HOS Engine</h3>
              <p className="text-sm text-[#777b86] leading-relaxed">
                Calculates precise 11-hour driving caps, 14-hour daily duty spans, 30-minute rest triggers, and 70-hour/8-day cumulative limits.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-xs font-medium text-[#17191c]">
              <ShieldCheck className="w-4 h-4 text-[#17191c]" />
              Zero compliance violations
            </div>
          </div>

          {/* Card 2 - Editorial Peach Accent Card */}
          <div className="bg-[#fbe1d1] text-[#5d2a1a] rounded-[24px] p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs text-[#5d2a1a]/70 uppercase tracking-wider font-medium mb-3">Daily Grid Sheets</p>
              <h3 className="font-serif text-xl text-[#5d2a1a] mb-2 font-normal">Standard 24-Hour ELD Logs</h3>
              <p className="text-sm text-[#5d2a1a]/80 leading-relaxed">
                Renders authentic 4-tier duty status charts (Off Duty, Sleeper Berth, Driving, On Duty) for each driving day with printable layout.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-xs font-medium text-[#5d2a1a]">
              <FileText className="w-4 h-4 text-[#5d2a1a]" />
              Inspection-ready format
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#f2f2f3] rounded-[24px] p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs text-[#979799] uppercase tracking-wider font-medium mb-3">Open Routing</p>
              <h3 className="font-serif text-xl text-[#17191c] mb-2 font-normal">OSRM Highway Routing</h3>
              <p className="text-sm text-[#777b86] leading-relaxed">
                Geocodes addresses and computes true road geometry with automatic 1,000-mile fuel stops and pickup/dropoff dwell times.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-xs font-medium text-[#17191c]">
              <Navigation className="w-4 h-4 text-[#17191c]" />
              No commercial API keys needed
            </div>
          </div>
        </div>
      </div>

      {/* Assumptions Footer */}
      <footer className="border-t border-[#ececec] bg-[#fafafb] py-8">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#777b86]">
            SpotterELD · Property-carrying CMV · 70h/8d cycle · 55 mph average · 1h pickup/dropoff · Fuel every ≤1,000 mi
          </p>
          <p className="text-xs text-[#979799]">
            FMCSA HOS Part 395 Compliant
          </p>
        </div>
      </footer>

      {/* Loading Overlay */}
      {state === 'loading' && (
        <LoadingOverlay steps={STEPS} currentStep={loadingStep} currentText={loadingText} />
      )}
    </div>
  )
}

