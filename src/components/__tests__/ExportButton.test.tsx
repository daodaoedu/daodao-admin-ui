import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExportButton } from '../ExportButton'

const mockData = [
  { name: 'Alice', email: 'alice@test.com' },
  { name: 'Bob', email: 'bob@test.com' },
]

const mockColumns = [
  { key: 'name', header: '名稱' },
  { key: 'email', header: 'Email' },
]

describe('ExportButton', () => {
  it('renders export button', () => {
    render(<ExportButton data={mockData} columns={mockColumns} fileName="test" />)
    expect(screen.getByText('匯出')).toBeInTheDocument()
  })

  it('shows dropdown on click', async () => {
    const user = userEvent.setup()
    render(<ExportButton data={mockData} columns={mockColumns} fileName="test" />)
    await user.click(screen.getByText('匯出'))
    expect(screen.getByText('CSV')).toBeInTheDocument()
    expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument()
  })

  it('shows alert when data is empty', async () => {
    const user = userEvent.setup()
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<ExportButton data={[]} columns={mockColumns} fileName="test" />)
    await user.click(screen.getByText('匯出'))
    await user.click(screen.getByText('CSV'))
    expect(alertMock).toHaveBeenCalledWith('沒有資料可匯出')
    alertMock.mockRestore()
  })

  it('disables button when disabled prop is true', () => {
    render(<ExportButton data={mockData} columns={mockColumns} fileName="test" disabled />)
    expect(screen.getByText('匯出')).toBeDisabled()
  })
})
