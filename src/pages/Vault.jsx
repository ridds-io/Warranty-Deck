// =============================================================================
// WARRANTYDECK — VAULT
// src/pages/Vault.jsx
// =============================================================================

import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import ReceiptCard from '../components/receipt/ReceiptCard'
import ReceiptUploader from '../components/receipt/ReceiptUploader'
import ReceiptScanner from '../components/receipt/ReceiptScanner'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { useReceipts } from '../hooks/useReceipts'

export default function Vault() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const searchQuery = params.get('search') || ''
  const [query, setQuery] = useState(searchQuery)
  const [category, setCategory] = useState('All')
  const { receipts, loading } = useReceipts()

  const categories = useMemo(() => {
    const unique = new Set(receipts.map(item => item.category))
    return ['All', ...Array.from(unique)]
  }, [receipts])

  const filtered = receipts.filter(receipt => {
    if (receipt.folderType !== 'vault') return false
    const matchesCategory = category === 'All' || receipt.category === category
    const matchesQuery = !query
      || receipt.storeName.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  })

  const handleSearch = (value) => {
    setQuery(value)
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    navigate({ search: params.toString() })
  }

  return (
    <PageWrapper title="Vault">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <ReceiptUploader onUpload={() => {}} />
        <ReceiptScanner onScan={() => {}} />

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {categories.map(item => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: category === item
                    ? 'var(--color-border-strong)'
                    : 'var(--color-border-soft)',
                  backgroundColor: category === item
                    ? 'var(--color-bg-elevated)'
                    : 'transparent',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <Input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search vault receipts"
          />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {loading ? (
            <EmptyState message="Loading receipts..." />
          ) : filtered.length === 0 ? (
            <EmptyState message="No receipts found." />
          ) : (
            filtered.map(receipt => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                onOpen={(id) => navigate(`/receipt/${id}`)}
              />
            ))
          )}
        </section>
      </div>
    </PageWrapper>
  )
}
