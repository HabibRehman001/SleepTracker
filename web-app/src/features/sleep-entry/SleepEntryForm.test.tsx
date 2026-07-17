import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mutate = vi.fn()

vi.mock('@/features/sleep-entry/useSleepEntries', () => ({
  useSaveSleepEntry: () => ({
    mutate,
    isPending: false,
  }),
}))

import { SleepEntryForm } from '@/features/sleep-entry/SleepEntryForm'

describe('SleepEntryForm', () => {
  beforeEach(() => {
    mutate.mockReset()
  })

  it('shows Required when bed time is cleared and form is submitted', async () => {
    const user = userEvent.setup()
    render(<SleepEntryForm />)

    const bedTime = screen.getByLabelText(/bed time/i)
    await user.clear(bedTime)
    await user.click(screen.getByRole('button', { name: /save entry/i }))

    await waitFor(() => {
      expect(screen.getAllByRole('alert').some((el) => /required/i.test(el.textContent ?? ''))).toBe(
        true
      )
    })
    expect(mutate).not.toHaveBeenCalled()
  })

  it('rejects sleepQuality below 1 without calling the network', async () => {
    const user = userEvent.setup()
    render(<SleepEntryForm />)

    await user.click(screen.getByTestId('force-invalid-quality'))

    await waitFor(() => {
      expect(screen.getByTestId('sleep-quality-error')).toHaveTextContent(
        /must be at least 1/i
      )
    })
    expect(mutate).not.toHaveBeenCalled()
  })

  it('submits valid defaults via mutate', async () => {
    const user = userEvent.setup()
    render(<SleepEntryForm />)

    await user.click(screen.getByRole('button', { name: /save entry/i }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1)
    })
    const payload = mutate.mock.calls[0][0] as { sleepQuality: number; bedTime: string }
    expect(payload.sleepQuality).toBe(7)
    expect(payload.bedTime).toBeTruthy()
  })
})
