import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CorrelationCard } from '@/features/dashboard/CorrelationCard'

describe('CorrelationCard', () => {
  it('renders both group states with averages', () => {
    render(
      <CorrelationCard
        factor="Phone before sleep vs latency"
        outcome="latency"
        groupA={{ label: 'YES', avg: 87, n: 5 }}
        groupB={{ label: 'NO', avg: 21, n: 4 }}
      />
    )

    expect(screen.getByTestId('correlation-card-factor')).toHaveTextContent(
      'Phone before sleep vs latency'
    )
    expect(screen.getByTestId('correlation-group-A')).toHaveAttribute(
      'data-empty',
      'false'
    )
    expect(screen.getByTestId('correlation-group-B')).toHaveAttribute(
      'data-empty',
      'false'
    )
    expect(screen.getByTestId('correlation-group-A-latency')).toHaveTextContent(
      /YES → 87 min avg latency/
    )
    expect(screen.getByTestId('correlation-group-B-latency')).toHaveTextContent(
      /NO → 21 min avg latency/
    )
  })

  it('renders empty group state as not enough data', () => {
    render(
      <CorrelationCard
        factor="Phone before sleep vs quality"
        outcome="quality"
        groupA={{ label: 'YES', avg: 7.5, n: 5 }}
        groupB={{ label: 'NO', avg: null, n: 0 }}
      />
    )

    expect(screen.getByTestId('correlation-group-A')).toHaveAttribute(
      'data-empty',
      'false'
    )
    expect(screen.getByTestId('correlation-group-B')).toHaveAttribute(
      'data-empty',
      'true'
    )
    expect(screen.getByTestId('correlation-group-A-latency')).toHaveTextContent(
      /7\.5 avg quality/
    )
    expect(screen.getByTestId('correlation-group-B-latency')).toHaveTextContent(
      /not enough data/
    )
  })
})
