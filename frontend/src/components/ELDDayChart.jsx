const ROW_ORDER = ['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving']

const STATUS_LABELS = {
  off_duty: '1. Off Duty',
  sleeper_berth: '2. Sleeper Berth',
  driving: '3. Driving',
  on_duty_not_driving: '4. On Duty (Not Driving)',
}

const ROW_HEIGHT = 30
const LABEL_WIDTH = 140
const GRID_WIDTH = 680
const CHART_HEIGHT = ROW_ORDER.length * ROW_HEIGHT
const HEADER_HEIGHT = 32
const FOOTER_HEIGHT = 22
const TOTAL_WIDTH = LABEL_WIDTH + GRID_WIDTH + 60
const TOTAL_HEIGHT = HEADER_HEIGHT + CHART_HEIGHT + FOOTER_HEIGHT

export default function ELDDayChart({ log }) {
  if (!log) return null

  // Collect chronologically sorted segments
  const segments = (log.segments || []).filter(s => s.duration_hours > 0)

  // Build the continuous stepped line points
  // For each segment:
  // start point: (seg.start_hour, rowIndex)
  // end point: (seg.end_hour, rowIndex)
  // vertical connector to next segment: (next.start_hour, nextRowIndex)
  const linePoints = []
  const rowY = (status) => {
    const idx = ROW_ORDER.indexOf(status)
    return HEADER_HEIGHT + (idx >= 0 ? idx : 0) * ROW_HEIGHT + ROW_HEIGHT / 2
  }

  const hourToX = (hour) => LABEL_WIDTH + (hour / 24) * GRID_WIDTH

  segments.forEach((seg, i) => {
    const y = rowY(seg.status)
    const xStart = hourToX(seg.start_hour)
    const xEnd = hourToX(seg.end_hour)

    if (i === 0) {
      linePoints.push(`${xStart},${y}`)
    }
    linePoints.push(`${xEnd},${y}`)

    // Vertical line to next segment if status changes
    if (i < segments.length - 1) {
      const nextY = rowY(segments[i + 1].status)
      const nextX = hourToX(segments[i + 1].start_hour)
      linePoints.push(`${nextX},${nextY}`)
    }
  })

  const polylinePath = linePoints.join(' ')

  const timeLabels = ['M', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
                      'N', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'M']

  return (
    <div className="font-sans max-w-4xl mx-auto">
      {/* Date header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#f2f2f3]">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#979799] font-medium">Record of Duty Status</span>
          <h4 className="font-serif text-base font-normal text-[#17191c]">
            Day {log.day} — {log.date}
          </h4>
        </div>
        <div className="text-xs text-[#777b86]">
          Total: <span className="font-mono font-medium text-[#17191c]">24.0 hrs</span>
        </div>
      </div>

      {/* Compact Monochrome SVG Grid */}
      <div className="bg-white rounded-[16px] p-3 border border-[#ececec] shadow-xs">
        <svg
          viewBox={`0 0 ${TOTAL_WIDTH} ${TOTAL_HEIGHT}`}
          width="100%"
          className="overflow-visible"
          fontFamily="Inter, ui-sans-serif, sans-serif"
        >
          {/* Row background bands */}
          {ROW_ORDER.map((status, rowIdx) => {
            const y = HEADER_HEIGHT + rowIdx * ROW_HEIGHT
            return (
              <rect
                key={status}
                x={LABEL_WIDTH}
                y={y}
                width={GRID_WIDTH}
                height={ROW_HEIGHT}
                fill={rowIdx % 2 === 0 ? '#fafafa' : '#ffffff'}
              />
            )
          })}

          {/* 15-Minute Minor Grid Ticks & 1-Hour Major Lines */}
          {Array.from({ length: 24 * 4 + 1 }, (_, i) => {
            const hour = i / 4
            const x = LABEL_WIDTH + (hour / 24) * GRID_WIDTH
            const isHour = i % 4 === 0
            const isMajor = i % 24 === 0 // 6-hour interval

            if (isHour) {
              return (
                <line
                  key={i}
                  x1={x} y1={HEADER_HEIGHT}
                  x2={x} y2={HEADER_HEIGHT + CHART_HEIGHT}
                  stroke={isMajor ? '#979799' : '#e5e7eb'}
                  strokeWidth={isMajor ? 1 : 0.5}
                />
              )
            } else {
              // 15-min small tick at row separators
              return ROW_ORDER.map((_, rIdx) => (
                <line
                  key={`${i}-${rIdx}`}
                  x1={x} y1={HEADER_HEIGHT + rIdx * ROW_HEIGHT}
                  x2={x} y2={HEADER_HEIGHT + rIdx * ROW_HEIGHT + 3}
                  stroke="#d1d5db"
                  strokeWidth={0.5}
                />
              ))
            }
          })}

          {/* Horizontal Row Divider Lines */}
          {ROW_ORDER.map((_, rowIdx) => (
            <line
              key={rowIdx}
              x1={LABEL_WIDTH} y1={HEADER_HEIGHT + rowIdx * ROW_HEIGHT}
              x2={LABEL_WIDTH + GRID_WIDTH} y2={HEADER_HEIGHT + rowIdx * ROW_HEIGHT}
              stroke="#e5e7eb" strokeWidth={0.75}
            />
          ))}
          <line
            x1={LABEL_WIDTH} y1={HEADER_HEIGHT + CHART_HEIGHT}
            x2={LABEL_WIDTH + GRID_WIDTH} y2={HEADER_HEIGHT + CHART_HEIGHT}
            stroke="#979799" strokeWidth={1}
          />

          {/* Top Hour Labels (Midnight, 1..11, Noon, 1..11, Midnight) */}
          {timeLabels.map((label, i) => {
            const x = LABEL_WIDTH + (i / 24) * GRID_WIDTH
            const isMajor = i === 0 || i === 12 || i === 24
            return (
              <text
                key={i}
                x={x} y={HEADER_HEIGHT - 7}
                textAnchor="middle"
                fontSize={isMajor ? 9.5 : 8}
                fontWeight={isMajor ? '600' : '400'}
                fill={isMajor ? '#17191c' : '#777b86'}
              >
                {label}
              </text>
            )
          })}

          {/* Row Labels (Left Side) */}
          {ROW_ORDER.map((status, rowIdx) => {
            const y = HEADER_HEIGHT + rowIdx * ROW_HEIGHT + ROW_HEIGHT / 2 + 3.5
            return (
              <text
                key={status}
                x={LABEL_WIDTH - 8}
                y={y}
                textAnchor="end"
                fontSize={9.5}
                fontWeight="500"
                fill="#17191c"
              >
                {STATUS_LABELS[status]}
              </text>
            )
          })}

          {/* Row Total Hours (Right Side Column) */}
          {ROW_ORDER.map((status, rowIdx) => {
            const y = HEADER_HEIGHT + rowIdx * ROW_HEIGHT + ROW_HEIGHT / 2 + 3.5
            const total = log.totals[status] || 0
            return (
              <text
                key={`tot-${status}`}
                x={LABEL_WIDTH + GRID_WIDTH + 14}
                y={y}
                textAnchor="start"
                fontSize={9.5}
                fontWeight="600"
                fill="#17191c"
                fontFamily="monospace"
              >
                {total.toFixed(1)}
              </text>
            )
          })}
          {/* Column header for total */}
          <text
            x={LABEL_WIDTH + GRID_WIDTH + 14}
            y={HEADER_HEIGHT - 7}
            textAnchor="start"
            fontSize={8}
            fontWeight="600"
            fill="#777b86"
          >
            HRS
          </text>

          {/* Duty Timeline Subtle Shaded Bands (Monochrome) */}
          {segments.map((seg, si) => {
            const segX = hourToX(seg.start_hour)
            const segW = (seg.duration_hours / 24) * GRID_WIDTH
            const rowIdx = ROW_ORDER.indexOf(seg.status)
            const y = HEADER_HEIGHT + rowIdx * ROW_HEIGHT + 3
            if (seg.status === 'off_duty') return null
            return (
              <rect
                key={`band-${si}`}
                x={segX}
                y={y}
                width={Math.max(segW, 1.5)}
                height={ROW_HEIGHT - 6}
                fill="#17191c"
                opacity={seg.status === 'driving' ? 0.22 : 0.10}
                rx={1}
              />
            )
          })}

          {/* Continuous Monochrome Stepped Duty Line (Official Log Format) */}
          {polylinePath && (
            <polyline
              points={polylinePath}
              fill="none"
              stroke="#17191c"
              strokeWidth={2.25}
              strokeLinejoin="miter"
              strokeLinecap="square"
            />
          )}

          {/* Bottom Time Axis (Major Intervals) */}
          {[0, 6, 12, 18, 24].map(h => {
            const x = LABEL_WIDTH + (h / 24) * GRID_WIDTH
            const label = h === 0 || h === 24 ? 'Midnight' : h === 12 ? 'Noon' : `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`
            return (
              <text
                key={h}
                x={x}
                y={HEADER_HEIGHT + CHART_HEIGHT + 15}
                textAnchor="middle"
                fontSize={8}
                fill="#777b86"
                fontWeight="400"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}


