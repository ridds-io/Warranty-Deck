// =============================================================================
// WARRANTYDECK — RECEIPT DETAIL
// src/pages/ReceiptDetail.jsx
// =============================================================================

import { useParams, useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import ReceiptSummary from '../components/receipt/ReceiptSummary'
import WarrantyCard from '../components/warranty/WarrantyCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useReceipt } from '../hooks/useReceipts'
import { useWarranties } from '../hooks/useWarranties'

export default function ReceiptDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { receipt, loading } = useReceipt(id)
  const { warranties, loading: warrantiesLoading } = useWarranties()

  const linkedWarranty = warranties.find(item => (
    item.id === receipt?.warrantyId || item.receiptId === receipt?.id
  ))

  if (loading) {
    return (
      <PageWrapper title="Receipt">
        <EmptyState message="Loading receipt..." />
      </PageWrapper>
    )
  }

  if (!receipt) {
    return (
      <PageWrapper title="Receipt">
        <EmptyState message="Receipt not found." />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Receipt Detail">
      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <section
          className="animate-receipt-unfold"
          style={{
            backgroundColor: 'var(--color-receipt-bg)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-8)',
            boxShadow: 'var(--shadow-receipt)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-lg)', letterSpacing: 'var(--tracking-wider)' }}>
              {receipt.storeName}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              {receipt.purchaseDate}
            </div>
          </div>

          <div style={{ borderTop: '2px dashed var(--color-border-dashed)', margin: 'var(--space-6) 0' }} />

          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {receipt.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  borderBottom: '1px solid var(--color-border-soft)',
                  paddingBottom: 'var(--space-2)',
                }}
              >
                <span>{item.qty}x {item.name}</span>
                <span>${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px dashed var(--color-border-dashed)', margin: 'var(--space-6) 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-lg)' }}>
            <span>Total</span>
            <span>${receipt.totalAmount.toFixed(2)}</span>
          </div>
        </section>

        <ReceiptSummary
          summary={receipt.aiSummary || 'AI summary will appear here once Groq is connected.'}
          benefits={[]}
        />

        {warrantiesLoading ? (
          <EmptyState message="Loading warranty..." />
        ) : linkedWarranty && (
          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
                Warranty
              </h2>
              <Button size="sm" variant="outline" onClick={() => navigate(`/warranty/${linkedWarranty.id}`)}>
                Open warranty
              </Button>
            </div>
            <WarrantyCard warranty={linkedWarranty} onOpen={() => {}} />
          </section>
        )}

        <Button onClick={() => navigate('/chat')}>Chat about this receipt</Button>
      </div>
    </PageWrapper>
  )
}
