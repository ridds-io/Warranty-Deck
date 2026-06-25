// =============================================================================
// WARRANTYDECK — MEMORABILIA
// src/pages/Memorabilia.jsx
// =============================================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import ReceiptCard from '../components/receipt/ReceiptCard'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { useReceipts } from '../hooks/useReceipts'

export default function Memorabilia() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { receipts, loading } = useReceipts()

  // Debug logging
  useEffect(() => {
    console.log('=== MEMORABILIA DEBUG ===')
    console.log('Total receipts loaded:', receipts.length)
    console.log('Receipts with folderType:', receipts.map(r => ({
      id: r.id,
      store: r.storeName,
      folderType: r.folderType,
      category: r.category
    })))
    const memorabiliaReceipts = receipts.filter(r => r.folderType === 'memorabilia')
    console.log('Filtered memorabilia count:', memorabiliaReceipts.length)
    console.log('Memorabilia receipts:', memorabiliaReceipts)
    console.log('========================')
  }, [receipts])

  const filtered = receipts.filter(receipt => {
    if (receipt.folderType !== 'memorabilia') return false
    if (!query) return true
    return receipt.storeName.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <PageWrapper title="Memorabilia">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search memorabilia receipts"
        />

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
            <EmptyState message="No memorabilia receipts yet." />
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
