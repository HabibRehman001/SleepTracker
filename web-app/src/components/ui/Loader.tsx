import * as React from 'react'

/**
 * SleepTrackerLoader
 * ------------------------------------------------------------------------
 * Themed loading indicator (dark blue / light blue / near-black).
 * Styles live in `index.css` under `.stl-*` (Step 109).
 *
 *   <SleepTrackerLoader label="Loading your sleep data…" />
 *   <SleepTrackerLoader fullScreen={false} size="sm" label="Syncing…" />
 * ------------------------------------------------------------------------
 */

export type SleepTrackerLoaderSize = 'sm' | 'md' | 'lg'

export interface SleepTrackerLoaderProps {
  /** Covers the viewport as a full-screen overlay. Default: false (inline). */
  fullScreen?: boolean
  /** Visible caption under the animation. Pass "" to hide it. */
  label?: string
  /** Controls the scale of the whole widget. Default: "md". */
  size?: SleepTrackerLoaderSize
  /** Extra class names to merge onto the root element. */
  className?: string
}

export function SleepTrackerLoader({
  fullScreen = false,
  label = 'Loading your sleep data…',
  size = 'md',
  className = '',
}: SleepTrackerLoaderProps) {
  const rootClasses = [
    'stl-root',
    `stl-size-${size}`,
    fullScreen ? 'stl-overlay' : 'stl-inline',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <React.Fragment>
      <div
        className={rootClasses}
        role="status"
        aria-live="polite"
        data-testid="sleep-loader"
      >
        <div className="stl-scene">
          <div className="stl-glow" aria-hidden="true" />

          <svg
            className="stl-moon-svg"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <radialGradient id="stl-moon-fill" cx="35%" cy="35%" r="75%">
                <stop className="stl-stop-1" offset="0%" />
                <stop className="stl-stop-2" offset="55%" />
                <stop className="stl-stop-3" offset="100%" />
              </radialGradient>
              <mask id="stl-crescent-mask">
                <rect x="0" y="0" width="100" height="100" fill="black" />
                <circle cx="50" cy="50" r="34" fill="white" />
                <circle cx="64" cy="38" r="28" fill="black" />
              </mask>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="url(#stl-moon-fill)"
              mask="url(#stl-crescent-mask)"
            />
          </svg>

          <span className="stl-star stl-star1" aria-hidden="true" />
          <span className="stl-star stl-star2" aria-hidden="true" />
          <span className="stl-star stl-star3" aria-hidden="true" />
          <span className="stl-star stl-star4" aria-hidden="true" />
          <span className="stl-star stl-star5" aria-hidden="true" />

          <span className="stl-z stl-z1" aria-hidden="true">
            Z
          </span>
          <span className="stl-z stl-z2" aria-hidden="true">
            Z
          </span>
          <span className="stl-z stl-z3" aria-hidden="true">
            Z
          </span>
        </div>

        {label ? (
          <p className="stl-label">{label}</p>
        ) : (
          <span className="stl-visually-hidden">Loading…</span>
        )}
      </div>
    </React.Fragment>
  )
}

/** Alias used across feature pages (Step 109). */
export const Loader = SleepTrackerLoader

export default SleepTrackerLoader
