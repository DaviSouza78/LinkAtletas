import { useState, useMemo } from 'react'
import { loadDatasets } from '../data/mock'
import type { TrainingLoadPoint } from '../types'

interface TrainingLoadChartProps {
  period: '4' | '8' | '12'
  onPeriodChange?: (period: '4' | '8' | '12') => void
}

export function TrainingLoadChart({ period }: TrainingLoadChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const data: TrainingLoadPoint[] = useMemo(() => loadDatasets[period] || loadDatasets['8'], [period])

  const width = 800
  const height = 260
  const paddingLeft = 46
  const paddingRight = 30
  const paddingTop = 28
  const paddingBottom = 42

  const graphWidth = width - paddingLeft - paddingRight
  const graphHeight = height - paddingTop - paddingBottom

  const maxVal = 100
  const minVal = 0

  const yTicks = [100, 75, 50, 25, 0]

  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = paddingLeft + (i / (data.length - 1)) * graphWidth
      const yPlanned = paddingTop + (1 - (d.planned - minVal) / (maxVal - minVal)) * graphHeight
      const yActual = paddingTop + (1 - (d.actual - minVal) / (maxVal - minVal)) * graphHeight
      return { ...d, x, yPlanned, yActual, index: i }
    })
  }, [data, graphWidth, graphHeight, paddingLeft, paddingTop])

  const plannedPolyline = points.map(p => `${p.x},${p.yPlanned}`).join(' ')
  const actualPolyline = points.map(p => `${p.x},${p.yActual}`).join(' ')

  const areaPolygon = `${points[0].x},${paddingTop + graphHeight} ` +
    points.map(p => `${p.x},${p.yActual}`).join(' ') +
    ` ${points[points.length - 1].x},${paddingTop + graphHeight}`

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1]

  return (
    <div className="interactive-chart-container" style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#43a39e" stopOpacity="0.32" />
            <stop offset="70%" stopColor="#74d6d1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#74d6d1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines & Y-Axis Labels */}
        {yTicks.map(val => {
          const y = paddingTop + (1 - val / 100) * graphHeight
          return (
            <g key={`ytick-${val}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#eef2ef"
                strokeWidth="1.2"
                strokeDasharray={val === 0 ? undefined : '4 4'}
              />
              <text
                x={paddingLeft - 12}
                y={y + 4}
                textAnchor="end"
                fill="#82948d"
                fontSize="12"
                fontWeight="700"
                fontFamily="'DM Sans', system-ui, sans-serif"
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* Gradient fill under actual load curve */}
        <polygon points={areaPolygon} fill="url(#chartAreaGrad)" />

        {/* Planned load line (dashed) */}
        <polyline
          points={plannedPolyline}
          fill="none"
          stroke="#a4b8af"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Actual load line (solid teal) */}
        <polyline
          points={actualPolyline}
          fill="none"
          stroke="#2d8782"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertical crosshair indicator on hover */}
        {hoveredIndex !== null && (
          <line
            x1={points[hoveredIndex].x}
            y1={paddingTop}
            x2={points[hoveredIndex].x}
            y2={paddingTop + graphHeight}
            stroke="#101916"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.4"
          />
        )}

        {/* Planned nodes */}
        {points.map((p, i) => (
          <circle
            key={`p-${i}`}
            cx={p.x}
            cy={p.yPlanned}
            r={3.5}
            fill="#ffffff"
            stroke="#a4b8af"
            strokeWidth="2"
          />
        ))}

        {/* Actual nodes with hover interactions */}
        {points.map((p, i) => {
          const isHovered = hoveredIndex === i
          return (
            <g key={`act-${i}`} style={{ cursor: 'pointer' }}>
              {isHovered && (
                <circle
                  cx={p.x}
                  cy={p.yActual}
                  r={12}
                  fill="#74d6d1"
                  opacity="0.3"
                />
              )}
              <circle
                cx={p.x}
                cy={p.yActual}
                r={isHovered ? 7 : 5}
                fill={isHovered ? '#101916' : '#ffffff'}
                stroke={isHovered ? '#74d6d1' : '#2d8782'}
                strokeWidth={isHovered ? 3.5 : 2.5}
                onMouseEnter={() => setHoveredIndex(i)}
              />
              {/* Invisible touch/mouse hit target */}
              <rect
                x={p.x - 22}
                y={0}
                width={44}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
              />
            </g>
          )
        })}

        {/* X-Axis Labels positioned under each data point */}
        {points.map((p, i) => {
          const isHovered = hoveredIndex === i
          return (
            <text
              key={`xlabel-${i}`}
              x={p.x}
              y={height - 12}
              textAnchor="middle"
              fill={isHovered ? '#101916' : '#73867e'}
              fontSize="12"
              fontWeight={isHovered ? '800' : '600'}
              fontFamily="'DM Sans', system-ui, sans-serif"
              style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
              onMouseEnter={() => setHoveredIndex(i)}
            >
              {p.label}
            </text>
          )
        })}
      </svg>

      {/* Floating Tooltip positioned over the active/hovered node */}
      {activePoint && (
        <div
          className={`chart-tooltip ${hoveredIndex !== null ? 'chart-tooltip--active' : ''}`}
          style={{
            position: 'absolute',
            left: `${(activePoint.x / width) * 100}%`,
            top: `${(activePoint.yActual / height) * 100}%`,
            pointerEvents: 'none',
          }}
        >
          <div className="chart-tooltip__header">{activePoint.fullLabel}</div>
          <div className="chart-tooltip__row">
            <span className="dot dot--cyan" />
            <span className="label">Realizada:</span>
            <strong>{activePoint.actual} pts</strong>
          </div>
          <div className="chart-tooltip__row">
            <span className="dot dot--grey" />
            <span className="label">Planejada:</span>
            <span>{activePoint.planned} pts</span>
          </div>
          <div className="chart-tooltip__status">
            {activePoint.difference > 0 ? (
              <span className="trend-pos">+{activePoint.difference} pts acima da meta</span>
            ) : activePoint.difference < 0 ? (
              <span className="trend-neg">{activePoint.difference} pts abaixo</span>
            ) : (
              <span className="trend-neutral">100% alinhado à meta</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


interface AdherenceDonutChartProps {
  onTimePercent?: number
  delayedPercent?: number
  missedPercent?: number
  totalPercent?: number
}

export function AdherenceDonutChart({
  onTimePercent = 82,
  delayedPercent = 10,
  missedPercent = 8,
  totalPercent = 92,
}: AdherenceDonutChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  const radius = 64
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius

  // Calculate segment lengths
  const onTimeLength = (onTimePercent / 100) * circumference
  const delayedLength = (delayedPercent / 100) * circumference
  const missedLength = (missedPercent / 100) * circumference

  // Offsets for stacked ring segments
  const onTimeOffset = 0
  const delayedOffset = -onTimeLength
  const missedOffset = -(onTimeLength + delayedLength)

  return (
    <div className="adherence-chart-wrapper">
      <div className="donut-svg-container">
        <svg viewBox="0 0 160 160" className="donut-svg">
          {/* Background subtle track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#e4ebe7"
            strokeWidth={strokeWidth}
          />

          {/* Segment: On time (Lime/Green) */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#d7f266"
            strokeWidth={hoveredSegment === 'ontime' ? strokeWidth + 3 : strokeWidth}
            strokeDasharray={`${onTimeLength} ${circumference - onTimeLength}`}
            strokeDashoffset={onTimeOffset}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            className="donut-segment segment--ontime"
            onMouseEnter={() => setHoveredSegment('ontime')}
            onMouseLeave={() => setHoveredSegment(null)}
          />

          {/* Segment: Delayed (Orange) */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#f5b97e"
            strokeWidth={hoveredSegment === 'delayed' ? strokeWidth + 3 : strokeWidth}
            strokeDasharray={`${delayedLength} ${circumference - delayedLength}`}
            strokeDashoffset={delayedOffset}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            className="donut-segment segment--delayed"
            onMouseEnter={() => setHoveredSegment('delayed')}
            onMouseLeave={() => setHoveredSegment(null)}
          />

          {/* Segment: Missed (Muted Rose) */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#e58f8f"
            strokeWidth={hoveredSegment === 'missed' ? strokeWidth + 3 : strokeWidth}
            strokeDasharray={`${missedLength} ${circumference - missedLength}`}
            strokeDashoffset={missedOffset}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            className="donut-segment segment--missed"
            onMouseEnter={() => setHoveredSegment('missed')}
            onMouseLeave={() => setHoveredSegment(null)}
          />
        </svg>

        {/* Center Label */}
        <div className="donut-center-info">
          {hoveredSegment === 'ontime' ? (
            <>
              <strong>{onTimePercent}%</strong>
              <span className="highlight-tag">No prazo</span>
            </>
          ) : hoveredSegment === 'delayed' ? (
            <>
              <strong>{delayedPercent}%</strong>
              <span className="highlight-tag highlight-tag--warn">Com atraso</span>
            </>
          ) : hoveredSegment === 'missed' ? (
            <>
              <strong>{missedPercent}%</strong>
              <span className="highlight-tag highlight-tag--danger">Não realizados</span>
            </>
          ) : (
            <>
              <strong>{totalPercent}%</strong>
              <span>Excelente</span>
            </>
          )}
        </div>
      </div>

      <div className="adherence-breakdown">
        <span
          className={`legend-item ${hoveredSegment === 'ontime' ? 'legend-item--active' : ''}`}
          onMouseEnter={() => setHoveredSegment('ontime')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <i className="good" /> No prazo <b>{onTimePercent}%</b>
        </span>
        <span
          className={`legend-item ${hoveredSegment === 'delayed' ? 'legend-item--active' : ''}`}
          onMouseEnter={() => setHoveredSegment('delayed')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <i className="late" /> Com atraso <b>{delayedPercent}%</b>
        </span>
        <span
          className={`legend-item ${hoveredSegment === 'missed' ? 'legend-item--active' : ''}`}
          onMouseEnter={() => setHoveredSegment('missed')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <i className="missed" /> Não realizados <b>{missedPercent}%</b>
        </span>
      </div>
    </div>
  )
}

interface RevenueBarChartProps {
  data?: number[]
  months?: string[]
}

export function RevenueBarChart({
  data = [8400, 9200, 8950, 10100, 10600, 11320],
  months = ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'],
}: RevenueBarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const max = Math.max(...data, 12000)

  return (
    <div className="interactive-bar-chart">
      <div className="bar-chart-grid">
        {data.map((val, i) => {
          const isHovered = hoveredBar === i
          const heightPercent = (val / max) * 100
          const gross = Math.round(val / 0.92)
          const fee = gross - val

          return (
            <div
              key={months[i] + i}
              className={`bar-column ${isHovered ? 'bar-column--active' : ''}`}
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div className="bar-track">
                {isHovered && (
                  <div className="bar-popover">
                    <span className="popover-title">{months[i]} 2026</span>
                    <div className="popover-line">
                      <span>Líquido:</span>
                      <strong>R$ {val.toLocaleString('pt-BR')}</strong>
                    </div>
                    <div className="popover-line popover-line--muted">
                      <span>Bruto:</span>
                      <span>R$ {gross.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="popover-line popover-line--muted">
                      <span>Taxa (8%):</span>
                      <span>- R$ {fee.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )}
                <div
                  className="bar-fill"
                  style={{ height: `${heightPercent}%` }}
                >
                  <span className="bar-val-badge">
                    R$ {(val / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
              <small className="bar-label">{months[i]}</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}
