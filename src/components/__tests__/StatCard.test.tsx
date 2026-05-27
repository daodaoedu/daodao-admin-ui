import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCard } from '../StatCard'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="總用戶" value={1234} />)
    expect(screen.getByText('總用戶')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('renders string value as-is', () => {
    render(<StatCard title="成功率" value="98.5%" />)
    expect(screen.getByText('98.5%')).toBeInTheDocument()
  })

  it('shows positive change indicator', () => {
    render(<StatCard title="DAU" value={100} change={5.2} changeLabel="vs 昨日" />)
    expect(screen.getByText('+5.2%')).toBeInTheDocument()
    expect(screen.getByText('vs 昨日')).toBeInTheDocument()
  })

  it('shows negative change indicator', () => {
    render(<StatCard title="DAU" value={100} change={-3.1} />)
    expect(screen.getByText('-3.1%')).toBeInTheDocument()
  })

  it('renders without change when not provided', () => {
    const { container } = render(<StatCard title="Test" value={0} />)
    expect(container.querySelector('.text-success')).toBeNull()
    expect(container.querySelector('.text-destructive')).toBeNull()
  })
})
